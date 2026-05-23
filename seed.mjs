import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const sb = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

const users = [
  { email: "admin@mukuba.edu.zm", password: "Admin@Mukuba2026", full_name: "Dr. Chanda Mwape", student_id: "STAFF-001", role: "admin" },
  { email: "registrar@mukuba.edu.zm", password: "Registrar@2026", full_name: "Mary Banda", student_id: "STAFF-002", role: "staff" },
  { email: "kabwe.j@student.mukuba.edu.zm", password: "Student@2026", full_name: "Joseph Kabwe", student_id: "MU/2023/0451", role: "student" },
  { email: "phiri.n@student.mukuba.edu.zm", password: "Student@2026", full_name: "Natasha Phiri", student_id: "MU/2023/0289", role: "student" },
  { email: "mulenga.c@student.mukuba.edu.zm", password: "Student@2026", full_name: "Chimwemwe Mulenga", student_id: "MU/2022/1102", role: "student" },
  { email: "tembo.b@student.mukuba.edu.zm", password: "Student@2026", full_name: "Bwalya Tembo", student_id: "MU/2024/0073", role: "student" },
];

const ids = {};
for (const u of users) {
  const { data: existing } = await sb.auth.admin.listUsers();
  const found = existing.users.find((x) => x.email === u.email);
  let id;
  if (found) {
    id = found.id;
    await sb.auth.admin.updateUserById(id, { password: u.password, email_confirm: true });
    console.log("updated", u.email);
  } else {
    const { data, error } = await sb.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: { full_name: u.full_name, student_id: u.student_id },
    });
    if (error) { console.error(u.email, error.message); continue; }
    id = data.user.id;
    console.log("created", u.email);
  }
  ids[u.email] = { id, ...u };
  // ensure profile name + student_id correct
  await sb.from("profiles").update({ full_name: u.full_name, student_id: u.student_id, university_email: u.email }).eq("id", id);
  if (u.role !== "student") {
    await sb.from("user_roles").upsert({ user_id: id, role: u.role }, { onConflict: "user_id,role" });
  }
}

// Departments
const departments = [
  { name: "Academic Affairs", slug: "academic-affairs", description: "Curriculum, lectures, examinations" },
  { name: "Student Hostels", slug: "hostels", description: "Accommodation and residential life" },
  { name: "Cafeteria Services", slug: "cafeteria", description: "Meals, menus and food safety" },
  { name: "ICT & Network", slug: "ict", description: "Wi-Fi, e-learning, computer labs" },
  { name: "Campus Security", slug: "security", description: "Safety, lighting, escort services" },
  { name: "Infrastructure", slug: "infrastructure", description: "Buildings, water, electricity" },
  { name: "Sports & Recreation", slug: "sports", description: "Sports facilities and clubs" },
];
const deptIds = {};
for (const d of departments) {
  const { data } = await sb.from("departments").upsert(d, { onConflict: "slug" }).select("id,slug").single();
  deptIds[d.slug] = data.id;
}
console.log("departments seeded");

// Suggestions
const studentIds = Object.values(ids).filter((u) => u.role === "student").map((u) => u.id);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const suggestions = [
  { title: "Extend library hours during exam week", body: "The library closes at 22:00 but during exam week many students need to study past midnight. Could we extend hours to 02:00 from week 12 onwards? Other Zambian universities like UNZA already do this.", category: "academics", priority: "high", department: "academic-affairs", status: "in_review", tags: ["library","exams"] },
  { title: "Wi-Fi keeps dropping in Block C hostel", body: "The Wi-Fi in Block C is unreliable between 19:00 and 23:00, exactly when we need it for assignments. The access point near room 312 seems to be the problem.", category: "ict", priority: "high", department: "ict", status: "in_progress", tags: ["wifi","hostel"] },
  { title: "Cafeteria nshima portions are too small", body: "The standard nshima portion at lunch is noticeably smaller than last semester while the price went up. Many students leave hungry.", category: "cafeteria", priority: "medium", department: "cafeteria", status: "submitted", tags: ["food","pricing"] },
  { title: "Need more lighting along the path to Block D", body: "The walkway between the lecture theatres and Block D hostel is very dark after 19:00. This is a safety concern for female students.", category: "security", priority: "urgent", department: "security", status: "in_progress", tags: ["safety","lighting"] },
  { title: "Online results portal not showing semester 2 grades", body: "It's been three weeks since exams and results for ACC 220 and BBA 210 are still not on the portal. The lecturers say they submitted them.", category: "academics", priority: "high", department: "academic-affairs", status: "resolved", tags: ["results","portal"] },
  { title: "Provide menstrual hygiene products in restrooms", body: "Most female restrooms on campus have no dispenser. A small monthly budget could make a big difference and is standard at modern universities.", category: "infrastructure", priority: "high", department: "infrastructure", status: "in_review", tags: ["welfare","restrooms"] },
  { title: "Add a vegetarian option to the daily menu", body: "Currently every main dish at the cafeteria contains meat or fish. A simple beans or vegetable stew option would help students with dietary needs.", category: "cafeteria", priority: "low", department: "cafeteria", status: "submitted", tags: ["food","inclusion"] },
  { title: "Sports field needs grass maintenance", body: "The main football field is mostly dust now. Inter-faculty games are coming up and the playing surface is dangerous.", category: "sports", priority: "medium", department: "sports", status: "submitted", tags: ["sports"] },
  { title: "Lecture theatre LT2 projector is broken", body: "The projector in LT2 has been faulty for over a month. Lecturers are resorting to whiteboards which is inefficient for engineering classes.", category: "infrastructure", priority: "high", department: "infrastructure", status: "in_progress", tags: ["equipment"] },
  { title: "Hostel water cuts every Tuesday morning", body: "For the last 5 Tuesdays, water has been off from 05:00 to 10:00 in Block A. We can't shower before morning lectures.", category: "hostel", priority: "high", department: "hostels", status: "resolved", tags: ["water","hostel"] },
  { title: "Bring back the campus shuttle to town", body: "The shuttle between campus and Kitwe town centre stopped operating last year. Public taxis are expensive for students.", category: "administration", priority: "medium", department: null, status: "submitted", tags: ["transport"] },
  { title: "Library books for new ICT curriculum are outdated", body: "The networking and cloud computing textbooks in the library are from 2012. We need newer editions to actually pass the modules.", category: "academics", priority: "medium", department: "academic-affairs", status: "in_review", tags: ["library","books"] },
];

const inserted = [];
for (const s of suggestions) {
  const { data, error } = await sb.from("suggestions").insert({
    author_id: pick(studentIds),
    title: s.title,
    body: s.body,
    category: s.category,
    priority: s.priority,
    department_id: s.department ? deptIds[s.department] : null,
    status: s.status,
    tags: s.tags,
    sentiment_label: s.priority === "urgent" ? "negative" : (s.status === "resolved" ? "positive" : "neutral"),
    sentiment_score: Math.random() * 2 - 1,
    resolved_at: s.status === "resolved" ? new Date().toISOString() : null,
    is_public: true,
  }).select("id").single();
  if (error) { console.error(s.title, error.message); continue; }
  inserted.push({ id: data.id, ...s });
}
console.log("suggestions seeded:", inserted.length);

// Responses on a few
const adminId = ids["admin@mukuba.edu.zm"].id;
const respondTo = inserted.filter((s) => s.status !== "submitted").slice(0, 6);
for (const s of respondTo) {
  await sb.from("responses").insert({
    suggestion_id: s.id,
    author_id: adminId,
    body: `Thank you for raising this. The ${s.department ?? "responsible"} team has reviewed your suggestion and ${s.status === "resolved" ? "implemented changes — please let us know if the issue persists." : "is actively working on it. We'll post updates here as we progress."}`,
    is_internal_note: false,
  });
}
console.log("responses seeded");

// Notifications for one student
const aStudent = studentIds[0];
const notes = [
  { type: "status_change", title: "Your suggestion is now In Progress", body: "Wi-Fi in Block C hostel", link: "/app/my-suggestions" },
  { type: "response", title: "New response from admin", body: "Library hours during exam week", link: "/app/my-suggestions" },
  { type: "resolved", title: "Resolved — Hostel water cuts every Tuesday", body: "Maintenance team has fixed the issue.", link: "/app/my-suggestions" },
];
for (const n of notes) {
  await sb.from("notifications").insert({ user_id: aStudent, ...n });
}
console.log("notifications seeded");

console.log("\n=== CREDENTIALS ===");
for (const u of users) console.log(`${u.role.padEnd(8)} ${u.email}  /  ${u.password}`);
