import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import Institution from "../models/Institution.js";
import Faculty from "../models/Faculty.js";
import Course from "../models/Course.js";

const dataDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "data");
const readJson = (file) => JSON.parse(fs.readFileSync(path.join(dataDir, file), "utf8"));

// Key in institution.json -> institution category
const INSTITUTION_GROUPS = {
    universities: "University",
    polytechnic: "Polytechnic",
    college_of_education: "College of Education",
};

const blankToUndefined = (value) => (value?.trim() ? value.trim() : undefined);

const seedInstitutions = async () => {
    const { institutions } = readJson("institution.json");
    const records = Object.entries(INSTITUTION_GROUPS).flatMap(([key, category]) =>
        institutions[key].map((item) => ({
            code: item.id.trim(),
            name: item.name,
            category,
            ownership: item.ownership,
            state: item.State,
            address: blankToUndefined(item.Address),
            logoUrl: blankToUndefined(item.logo_url),
            website: blankToUndefined(item.website),
        }))
    );

    const seen = new Map();
    const duplicates = records.filter((r) => seen.has(r.code) || !seen.set(r.code, r));
    if (duplicates.length) {
        throw new Error(`Duplicate institution codes in institution.json: ${duplicates.map((d) => d.code).join(", ")}`);
    }

    await Institution.bulkWrite(
        records.map((record) => ({
            updateOne: { filter: { code: record.code }, update: { $set: record }, upsert: true },
        }))
    );

    // Codes are globally unique, so courses may reference any institution type (e.g. polytechnics offering NCE)
    const docs = await Institution.find({}, { code: 1 }).lean();
    return new Map(docs.map((doc) => [doc.code, doc._id]));
};

const seedFaculty = async ({ category, code, name, degreeAwarded }) =>
    Faculty.findOneAndUpdate(
        { category, code },
        { $set: { name, degreeAwarded } },
        { upsert: true, returnDocument: "after" }
    );

const seedCourses = async (faculty, courses, institutionCodes, unresolved) => {
    const ops = courses.map((course) => {
        const institutionIds = [];
        for (const rawCode of course.institutions ?? []) {
            const id = institutionCodes.get(rawCode.trim());
            if (id) institutionIds.push(id);
            else unresolved.add(rawCode);
        }

        return {
            updateOne: {
                filter: { faculty: faculty._id, code: String(course.course_id).trim() },
                update: {
                    $set: { name: course.course_name ?? course.course },
                    $addToSet: { institutions: { $each: institutionIds } },
                },
                upsert: true,
            },
        };
    });

    if (ops.length) await Course.bulkWrite(ops, { ordered: true });
    return ops.length;
};

// Each data file lists faculty groups whose courses reference institutions of one category
const seedCatalog = async (codeMap) => {
    const report = [];

    const groupedSources = [
        { file: "faculty.json", key: "faculties", category: "University" },
        { file: "polytechnic.json", key: "schools", category: "Polytechnic" },
    ];

    for (const { file, key, category } of groupedSources) {
        const unresolved = new Set();
        let courseCount = 0;
        for (const group of readJson(file)[key]) {
            const faculty = await seedFaculty({
                category,
                code: group.id,
                name: group.faculty_name,
                degreeAwarded: group.degree_awarded,
            });
            courseCount += await seedCourses(faculty, group.courses, codeMap, unresolved);
        }
        report.push({ file, courseCount, unresolved });
    }

    // Colleges of Education have no faculties in the data, so they share a single NCE faculty
    const coe = readJson("college_of_education.json");
    const unresolved = new Set();
    const nceFaculty = await seedFaculty({
        category: "College of Education",
        code: "NCE",
        name: "School of Education (NCE)",
        degreeAwarded: coe.program_type,
    });
    const courseCount = await seedCourses(nceFaculty, coe.courses, codeMap, unresolved);
    report.push({ file: "college_of_education.json", courseCount, unresolved });

    return report;
};

const run = async () => {
    await connectDB();

    if (process.argv.includes("--fresh")) {
        await Promise.all([Institution.deleteMany({}), Faculty.deleteMany({}), Course.deleteMany({})]);
        // Courses used to be stored as departments; drop that collection if an older seed left it behind
        await mongoose.connection.db.dropCollection("departments").catch(() => {});
        console.log("Cleared institutions, faculties and courses");
    }

    // Drops stale indexes from older schemas (e.g. institutionId_1) and builds the current ones
    await Promise.all([Institution.syncIndexes(), Faculty.syncIndexes(), Course.syncIndexes()]);

    const codeMap = await seedInstitutions();
    const report = await seedCatalog(codeMap);

    for (const { file, courseCount, unresolved } of report) {
        console.log(`${file}: ${courseCount} courses processed`);
        if (unresolved.size) {
            console.warn(`  ${unresolved.size} institution codes not found in institution.json (skipped): ${[...unresolved].join(", ")}`);
        }
    }

    const [institutions, faculties, courses] = await Promise.all([
        Institution.countDocuments(),
        Faculty.countDocuments(),
        Course.countDocuments(),
    ]);
    console.log(`Done. Institutions: ${institutions}, Faculties: ${faculties}, Courses: ${courses}`);
};

run()
    .catch((error) => {
        console.error(`Seeding failed: ${error.message}`);
        process.exitCode = 1;
    })
    .finally(() => mongoose.disconnect());
