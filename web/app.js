const LEGACY_STORAGE_KEY = "gradely.workspace.v1";
const PAGE_TITLES = {
  dashboard: "Dashboard",
  courses: "My courses",
  attendance: "Attendance",
  tasks: "Tasks",
  notes: "Notes",
  profile: "My profile",
};

const landingPage = document.querySelector("#landing-page");
const appShell = document.querySelector("#app-shell");
const appContent = document.querySelector("#app-content");
const appMessage = document.querySelector("#app-message");
const signupForm = document.querySelector("#signup-form");
const signupError = document.querySelector("#signup-error");
const profileSignupFields = document.querySelector("#profile-signup-fields");
const authSubmit = document.querySelector("#auth-submit");
let currentPage = "dashboard";
let state = emptyState();
let lastSavedState = emptyState();
let supabaseClient = null;
let currentUser = null;
let authMode = "signup";
let legacyWorkspaceAvailable = false;

function emptyState() {
  return { profile: null, courses: [], tasks: [], notes: [] };
}

function copyState(value) {
  return JSON.parse(JSON.stringify(value));
}

function isValidWorkspace(value) {
  return Boolean(
    value &&
      typeof value === "object" &&
      value.profile &&
      typeof value.profile === "object" &&
      typeof value.profile.name === "string" &&
      typeof value.profile.semester === "string" &&
      Array.isArray(value.courses) &&
      Array.isArray(value.tasks) &&
      Array.isArray(value.notes)
  );
}

function readLegacyState() {
  const saved = localStorage.getItem(LEGACY_STORAGE_KEY);
  if (!saved) return null;

  const parsed = JSON.parse(saved);
  if (
    !parsed ||
    typeof parsed !== "object" ||
    !Array.isArray(parsed.courses) ||
    !Array.isArray(parsed.tasks) ||
    !Array.isArray(parsed.notes) ||
    (parsed.profile !== null && typeof parsed.profile !== "object")
  ) {
    throw new Error("The old browser workspace has an invalid format and was left untouched.");
  }

  return {
    profile: parsed.profile,
    courses: parsed.courses,
    tasks: parsed.tasks,
    notes: parsed.notes,
  };
}

function profileFromUser(user) {
  const metadata = user.user_metadata || {};
  const emailName = (user.email || "").split("@")[0];
  return {
    name: metadata.name || emailName || "Student",
    studentNumber: metadata.studentNumber || "",
    institution: metadata.institution || "",
    program: metadata.program || "",
    yearOfStudy: metadata.yearOfStudy || "",
    semester: metadata.semester || "",
  };
}

async function saveState() {
  if (!supabaseClient || !currentUser) {
    appMessage.textContent = "You are signed out. Sign in again before saving changes.";
    state = copyState(lastSavedState);
    return false;
  }

  try {
    const { error } = await supabaseClient.from("workspaces").upsert(
      {
        user_id: currentUser.id,
        data: state,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );
    if (error) throw error;

    lastSavedState = copyState(state);
    appMessage.textContent = "";
    return true;
  } catch (error) {
    state = copyState(lastSavedState);
    appMessage.textContent = "Could not save your workspace to Supabase. " + error.message;
    return false;
  }
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function todayString() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateFromString(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function daysFromToday(value) {
  const today = dateFromString(todayString());
  const target = dateFromString(value);
  return Math.round((target - today) / 86400000);
}

function formatDate(value) {
  if (!value) return "No date";
  return dateFromString(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getCourse(courseId) {
  return state.courses.find((course) => course.id === courseId);
}

function showApp(page, message) {
  currentPage = page || "dashboard";
  landingPage.hidden = true;
  appShell.hidden = false;
  document.body.classList.add("is-app");
  if (message) appMessage.textContent = message;
  renderPage();
}

function showLanding() {
  appShell.hidden = true;
  landingPage.hidden = false;
  document.body.classList.remove("is-app");
  window.scrollTo(0, 0);
}

function setAuthMode(mode) {
  authMode = mode;
  const signingIn = mode === "signin";
  profileSignupFields.hidden = signingIn;
  profileSignupFields.querySelectorAll("input").forEach((field) => {
    field.required = !signingIn;
  });
  document.querySelector("#auth-heading").textContent = signingIn
    ? "Sign in to Gradely"
    : "Create your Gradely account";
  authSubmit.textContent = signingIn ? "Sign in" : "Create account";
  document.querySelector("#auth-mode-toggle").textContent = signingIn
    ? "New to Gradely? Create an account"
    : "Already have an account? Sign in";
  document.querySelector("#password-hint").textContent = signingIn
    ? "Enter the password for your Gradely account."
    : "Use at least 8 characters. Supabase may ask you to confirm your email.";
  const passwordInput = signupForm.querySelector('input[name="password"]');
  passwordInput.autocomplete = signingIn ? "current-password" : "new-password";
  passwordInput.minLength = signingIn ? 1 : 8;
}

async function openWorkspace(user) {
  currentUser = user;
  const { data, error } = await supabaseClient
    .from("workspaces")
    .select("data")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw error;

  let welcomeMessage = "Your workspace is ready.";
  if (data) {
    if (!isValidWorkspace(data.data)) {
      throw new Error("The saved cloud workspace has an invalid format.");
    }
    state = data.data;
    legacyWorkspaceAvailable = Boolean(localStorage.getItem(LEGACY_STORAGE_KEY));
    if (legacyWorkspaceAvailable) {
      welcomeMessage = "Cloud workspace loaded. Your older browser copy was left untouched.";
    }
  } else {
    const legacyState = readLegacyState();
    let importedLegacy = false;
    if (legacyState) {
      const oldName = legacyState.profile && legacyState.profile.name;
      const oldWorkspace = oldName ? ` for ${oldName}` : "";
      const confirmed = window.confirm(
        `An older browser workspace${oldWorkspace} was found. Move it to the signed-in account ${user.email}?`
      );
      if (!confirmed) {
        const { error: signOutError } = await supabaseClient.auth.signOut();
        currentUser = null;
        if (signOutError) throw signOutError;
        setAuthMode("signin");
        showLanding();
        signupError.textContent = "Nothing was moved. Sign in again when you are ready to transfer the old workspace.";
        return;
      }
      importedLegacy = true;
    }

    state = importedLegacy ? legacyState : emptyState();
    if (!state.profile) state.profile = profileFromUser(user);
    lastSavedState = copyState(state);
    if (!(await saveState())) {
      throw new Error(appMessage.textContent);
    }

    legacyWorkspaceAvailable = Boolean(legacyState && !importedLegacy);
    if (importedLegacy) {
      try {
        localStorage.removeItem(LEGACY_STORAGE_KEY);
        legacyWorkspaceAvailable = false;
        welcomeMessage = "Your old browser workspace was moved to your Supabase account.";
      } catch {
        welcomeMessage = "Your workspace is saved to Supabase, but the old browser copy could not be removed.";
      }
    }
  }

  lastSavedState = copyState(state);
  showApp("dashboard", welcomeMessage);
}

async function initializeSupabase() {
  authSubmit.disabled = true;
  signupError.textContent = "Connecting to Supabase...";

  try {
    const response = await fetch("/api/config", { cache: "no-store" });
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      throw new Error("The /api/config endpoint returned a non-JSON response. Check the Vercel API deployment.");
    }
    const config = await response.json();
    if (!response.ok) throw new Error(config.error || "Could not load Supabase settings.");
    if (!window.supabase || typeof window.supabase.createClient !== "function") {
      throw new Error("Supabase client could not be loaded. Run npm install and restart the app.");
    }

    supabaseClient = window.supabase.createClient(config.url, config.publishableKey);
    const { data, error } = await supabaseClient.auth.getSession();
    if (error) throw error;
    authSubmit.disabled = false;
    signupError.textContent = "";

    if (data.session) {
      try {
        await openWorkspace(data.session.user);
      } catch (error) {
        setAuthMode("signin");
        showLanding();
        signupError.textContent = "Could not open your cloud workspace. " + error.message;
      }
    }
  } catch (error) {
    signupError.textContent = error.message;
  }
}

function renderPage() {
  document.querySelector("#page-title").textContent = PAGE_TITLES[currentPage];
  document.querySelector("#app-semester").textContent = state.profile.semester;
  document.querySelectorAll(".app-nav [data-page]").forEach((button) => {
    if (button.dataset.page === currentPage) {
      button.setAttribute("aria-current", "page");
    } else {
      button.removeAttribute("aria-current");
    }
  });

  const renderers = {
    dashboard: renderDashboard,
    courses: renderCourses,
    attendance: renderAttendance,
    tasks: renderTasks,
    notes: renderNotes,
    profile: renderProfile,
  };
  appContent.innerHTML = renderers[currentPage]();
}

function renderDashboard() {
  const completed = state.tasks.filter((task) => task.status === "Completed").length;
  const openTasks = state.tasks.filter((task) => task.status !== "Completed");
  const progress = state.tasks.length
    ? `${Math.round((completed / state.tasks.length) * 100)}%`
    : "No tasks yet";
  const coursesWithAttendance = state.courses.filter((course) => course.held > 0);
  const averageAttendance = coursesWithAttendance.length
    ? `${Math.round(
        coursesWithAttendance.reduce(
          (total, course) => total + (course.attended / course.held) * 100,
          0
        ) / coursesWithAttendance.length
      )}%`
    : "No classes yet";
  const nextTasks = openTasks
    .slice()
    .sort((first, second) => first.deadline.localeCompare(second.deadline))
    .slice(0, 4);
  const upcoming = nextTasks.length
    ? `<ul class="item-list">${nextTasks.map(taskSummary).join("")}</ul>`
    : `<div class="empty-state"><h3>No deadlines to show</h3><p>Add a task when you have something coming up.</p><button class="small-button" type="button" data-page="tasks">Go to tasks</button></div>`;
  const guidance = getGuidance();
  const guidanceContent = guidance.length
    ? `<ul class="guidance-list">${guidance.map((message) => `<li>${escapeHTML(message)}</li>`).join("")}</ul>`
    : `<p class="page-intro">You are all caught up. Keep adding your classes and tasks as the semester continues.</p>`;
  const firstStep = state.courses.length ? "Add a task" : "Add your first course";
  const firstPage = state.courses.length ? "tasks" : "courses";

  return `
    <section class="welcome-card">
      <div>
        <h2>Welcome, ${escapeHTML(state.profile.name)}!</h2>
        <p>Start small. You can add and update your information whenever you need.</p>
      </div>
      <button class="btn btn-light" type="button" data-page="${firstPage}">${firstStep}</button>
    </section>
    <section class="stat-grid" aria-label="Semester summary">
      <div class="stat-card"><span>Courses</span><strong>${state.courses.length}</strong></div>
      <div class="stat-card"><span>Average attendance</span><strong>${averageAttendance}</strong></div>
      <div class="stat-card"><span>Open tasks</span><strong>${openTasks.length}</strong></div>
      <div class="stat-card"><span>Activity progress</span><strong>${progress}</strong></div>
    </section>
    <div class="workspace-grid">
      <section class="panel"><h2>Upcoming work</h2>${upcoming}</section>
      <section class="panel"><h2>Helpful reminders</h2>${guidanceContent}</section>
    </div>
  `;
}

function taskSummary(task) {
  const overdue = task.status !== "Completed" && task.deadline < todayString();
  const course = getCourse(task.courseId);
  const status = overdue ? "Overdue" : task.status;
  const badgeClass = overdue ? "badge badge-warning" : "badge";
  return `
    <li class="item-card">
      <div class="item-heading">
        <h3>${escapeHTML(task.title)}</h3>
        <span class="${badgeClass}">${escapeHTML(status)}</span>
      </div>
      <p>${escapeHTML(course ? course.name : "Course removed")} · Due ${formatDate(task.deadline)}</p>
    </li>
  `;
}

function getGuidance() {
  const messages = [];
  if (!state.courses.length) {
    return ["Add a course to start tracking this semester."];
  }

  state.courses.forEach((course) => {
    if (course.held > 0 && (course.attended / course.held) * 100 < 80) {
      messages.push(`Attendance for ${course.name} is below 80%. Try to attend the next class.`);
    }
  });

  const openTasks = state.tasks.filter((task) => task.status !== "Completed");
  if (openTasks.some((task) => task.deadline < todayString())) {
    messages.push("You have overdue work. Review the deadlines and choose what to tackle first.");
  }
  if (openTasks.some((task) => daysFromToday(task.deadline) >= 0 && daysFromToday(task.deadline) <= 2)) {
    messages.push("At least one task is due soon. Make a little time for it today.");
  }
  if (openTasks.length > 5) {
    messages.push("You have several open tasks. Try sorting them by due date and priority.");
  }
  if (
    openTasks.some(
      (task) => task.type === "Exam" && daysFromToday(task.deadline) >= 0 && daysFromToday(task.deadline) <= 14
    )
  ) {
    messages.push("An exam is coming up in the next two weeks. Plan a short revision session.");
  }

  return messages.slice(0, 5);
}

function renderCourses() {
  const courseCards = state.courses.length
    ? `<ul class="course-list">${state.courses
        .map(
          (course) => `
            <li class="course-card">
              <div class="course-heading">
                <h3>${escapeHTML(course.name)}</h3>
                <button class="small-button small-button-danger" type="button" data-action="delete-course" data-id="${escapeHTML(course.id)}">Remove</button>
              </div>
              <p>${course.code ? `Course code: ${escapeHTML(course.code)} · ` : ""}${course.held} classes recorded</p>
            </li>
          `
        )
        .join("")}</ul>`
    : `<div class="empty-state"><h3>No courses yet</h3><p>Add a course to start tracking attendance, tasks, and notes.</p></div>`;

  return `
    <p class="page-intro">Add the courses you are taking this semester. You can remove a course later; its related tasks and notes will also be removed.</p>
    <form id="course-form" class="form-card workspace-form">
      <div class="form-row">
        <label>Course name<input name="name" required maxlength="100" placeholder="e.g. Database Systems" /></label>
        <label>Course code <span class="form-hint">(optional)</span><input name="code" maxlength="30" placeholder="e.g. CSC 201" /></label>
      </div>
      <button class="btn" type="submit">Add course</button>
      <p class="form-error" id="course-error" role="alert"></p>
    </form>
    <div class="page-heading"><div><h2>Your courses</h2><p>${state.courses.length} added</p></div></div>
    ${courseCards}
  `;
}

function renderAttendance() {
  if (!state.courses.length) return emptyPage("Add a course first", "Your attendance list will appear here once you have added a course.", "courses", "Go to courses");

  return `
    <p class="page-intro">After each class, choose whether you attended. Gradely keeps a running total for each course.</p>
    <section class="panel">
      ${state.courses
        .map((course) => {
          const percentage = course.held ? Math.round((course.attended / course.held) * 100) : null;
          return `
            <div class="attendance-row">
              <div>
                <strong>${escapeHTML(course.name)}</strong>
                <div class="form-hint">${course.held ? `${percentage}% attended · ${course.held - course.attended} missed` : "No classes recorded yet"}</div>
              </div>
              <div class="attendance-controls">
                <button class="small-button" type="button" data-action="record-attendance" data-result="present" data-id="${escapeHTML(course.id)}">+ Present</button>
                <button class="small-button" type="button" data-action="record-attendance" data-result="absent" data-id="${escapeHTML(course.id)}">+ Absent</button>
              </div>
            </div>
          `;
        })
        .join("")}
    </section>
  `;
}

function renderTasks() {
  if (!state.courses.length) return emptyPage("Add a course first", "Tasks belong to a course, so add one before creating a task.", "courses", "Go to courses");

  const tasks = state.tasks
    .slice()
    .sort((first, second) => first.deadline.localeCompare(second.deadline));
  const taskList = tasks.length
    ? `<ul class="item-list">${tasks.map(renderTask).join("")}</ul>`
    : `<div class="empty-state"><h3>No tasks yet</h3><p>Add an assignment, test, or exam to keep its due date in view.</p></div>`;
  const courseOptions = state.courses
    .map((course) => `<option value="${escapeHTML(course.id)}">${escapeHTML(course.name)}</option>`)
    .join("");

  return `
    <p class="page-intro">Add assignments, tests, and exams. Overdue is calculated automatically from the due date.</p>
    <form id="task-form" class="form-card workspace-form">
      <div class="form-row">
        <label>Task title<input name="title" required maxlength="120" placeholder="e.g. Chapter 3 assignment" /></label>
        <label>Course<select name="courseId" required>${courseOptions}</select></label>
      </div>
      <div class="form-row">
        <label>Type<select name="type"><option>Assignment</option><option>Test</option><option>Exam</option></select></label>
        <label>Priority<select name="priority"><option>Medium</option><option>High</option><option>Low</option></select></label>
      </div>
      <div class="form-row">
        <label>Date assigned<input name="dateAssigned" type="date" value="${todayString()}" required /></label>
        <label>Due date<input name="deadline" type="date" required /></label>
      </div>
      <label>Description <span class="form-hint">(optional)</span><textarea name="description" maxlength="500" placeholder="A short reminder about this task"></textarea></label>
      <button class="btn" type="submit">Add task</button>
      <p class="form-error" id="task-error" role="alert"></p>
    </form>
    <div class="page-heading"><div><h2>Your tasks</h2><p>Completed tasks count toward activity progress.</p></div></div>
    ${taskList}
  `;
}

function renderTask(task) {
  const course = getCourse(task.courseId);
  const overdue = task.status !== "Completed" && task.deadline < todayString();
  const badge = overdue
    ? `<span class="badge badge-warning">Overdue</span>`
    : `<span class="badge ${task.status === "Completed" ? "badge-success" : ""}">${escapeHTML(task.status)}</span>`;
  const description = task.description ? `<p>${escapeHTML(task.description)}</p>` : "";
  const actionLabel = task.status === "Completed" ? "Reopen task" : "Mark complete";

  return `
    <li class="item-card">
      <div class="item-heading">
        <h3>${escapeHTML(task.title)}</h3>
        ${badge}
      </div>
      <p>${escapeHTML(course ? course.name : "Course removed")} · ${escapeHTML(task.type)} · Due ${formatDate(task.deadline)} · ${escapeHTML(task.priority)} priority</p>
      ${description}
      <div class="item-actions">
        <button class="small-button" type="button" data-action="toggle-task" data-id="${escapeHTML(task.id)}">${actionLabel}</button>
        <button class="small-button small-button-danger" type="button" data-action="delete-task" data-id="${escapeHTML(task.id)}">Remove</button>
      </div>
    </li>
  `;
}

function renderNotes() {
  if (!state.courses.length) return emptyPage("Add a course first", "Notes are connected to a course, so add one before saving notes.", "courses", "Go to courses");

  const courseOptions = state.courses
    .map((course) => `<option value="${escapeHTML(course.id)}">${escapeHTML(course.name)}</option>`)
    .join("");
  const notes = state.notes
    .slice()
    .sort((first, second) => second.date.localeCompare(first.date));
  const noteList = notes.length
    ? `<ul class="item-list">${notes.map(renderNote).join("")}</ul>`
    : `<div class="empty-state"><h3>No notes yet</h3><p>Save your first topic or class note here.</p></div>`;

  return `
    <p class="page-intro">Keep class notes with the course they belong to. Your notes are saved to your Supabase account.</p>
    <form id="note-form" class="form-card workspace-form">
      <div class="form-row">
        <label>Course<select name="courseId" required>${courseOptions}</select></label>
        <label>Date<input name="date" type="date" value="${todayString()}" required /></label>
      </div>
      <label>Topic<input name="topic" required maxlength="120" placeholder="e.g. Introduction to databases" /></label>
      <label>Note<textarea name="content" required maxlength="3000" placeholder="Write a short note to help you remember..."></textarea></label>
      <button class="btn" type="submit">Save note</button>
      <p class="form-error" id="note-error" role="alert"></p>
    </form>
    <div class="page-heading"><div><h2>Your notes</h2><p>${notes.length} saved</p></div></div>
    ${noteList}
  `;
}

function renderNote(note) {
  const course = getCourse(note.courseId);
  return `
    <li class="item-card">
      <div class="item-heading">
        <h3>${escapeHTML(note.topic)}</h3>
        <span class="badge">${formatDate(note.date)}</span>
      </div>
      <p>${escapeHTML(course ? course.name : "Course removed")}</p>
      <p>${escapeHTML(note.content).replace(/\n/g, "<br />")}</p>
      <div class="item-actions">
        <button class="small-button small-button-danger" type="button" data-action="delete-note" data-id="${escapeHTML(note.id)}">Remove note</button>
      </div>
    </li>
  `;
}

function renderProfile() {
  const profile = state.profile;
  return `
    <p class="page-intro">Update your details or semester label. Changes are saved to your Supabase account.</p>
    <section class="panel">
      <h2>Account</h2>
      <dl class="profile-details">
        <div><dt>Email</dt><dd>${escapeHTML(currentUser.email || "")}</dd></div>
      </dl>
    </section>
    <form id="profile-form" class="form-card workspace-form">
      <label>Full name<input name="name" value="${escapeHTML(profile.name)}" required maxlength="80" /></label>
      <label>Student number<input name="studentNumber" value="${escapeHTML(profile.studentNumber)}" required maxlength="40" /></label>
      <label>Institution<input name="institution" value="${escapeHTML(profile.institution)}" required maxlength="100" /></label>
      <label>Program<input name="program" value="${escapeHTML(profile.program)}" required maxlength="100" /></label>
      <div class="form-row">
        <label>Year of study<input name="yearOfStudy" value="${escapeHTML(profile.yearOfStudy)}" required maxlength="40" /></label>
        <label>Semester<input name="semester" value="${escapeHTML(profile.semester)}" required maxlength="60" /></label>
      </div>
      <button class="btn" type="submit">Save profile</button>
      <p class="form-error" id="profile-error" role="alert"></p>
    </form>
    <section class="danger-zone">
      <h3>Delete cloud workspace</h3>
      <p>Remove the courses, attendance, tasks, and notes saved to this account, then sign out. This does not delete your Supabase account.</p>
      <button class="small-button small-button-danger" type="button" data-action="delete-workspace">Delete cloud workspace</button>
    </section>
    ${
      legacyWorkspaceAvailable
        ? `<section class="danger-zone">
            <h3>Old browser copy</h3>
            <p>A workspace from the earlier local version is still stored in this browser.</p>
            <button class="small-button small-button-danger" type="button" data-action="clear-local-workspace">Delete old browser copy</button>
          </section>`
        : ""
    }
  `;
}

function emptyPage(title, description, page, buttonText) {
  return `
    <p class="page-intro">${escapeHTML(description)}</p>
    <div class="empty-state">
      <h3>${escapeHTML(title)}</h3>
      <button class="small-button" type="button" data-page="${escapeHTML(page)}">${escapeHTML(buttonText)}</button>
    </div>
  `;
}

function formValues(form) {
  return Object.fromEntries(new FormData(form).entries());
}

async function handleSignup(event) {
  event.preventDefault();
  signupError.textContent = "";
  if (!supabaseClient) {
    signupError.textContent = "Supabase is not configured. Check the root .env file and restart the server.";
    return;
  }

  const values = formValues(signupForm);
  authSubmit.disabled = true;
  try {
    let response;
    if (authMode === "signup") {
      const profile = {
        name: values.name.trim(),
        studentNumber: values.studentNumber.trim(),
        institution: values.institution.trim(),
        program: values.program.trim(),
        yearOfStudy: values.yearOfStudy.trim(),
        semester: values.semester.trim(),
      };
      if (Object.values(profile).some((value) => !value)) {
        throw new Error("Please fill in every profile field.");
      }

      response = await supabaseClient.auth.signUp({
        email: values.email.trim(),
        password: values.password,
        options: { data: profile },
      });
      if (response.error) throw response.error;

      if (!response.data.session) {
        setAuthMode("signin");
        signupError.textContent = "Account created. Confirm your email, then sign in to open your workspace.";
        return;
      }
    } else {
      response = await supabaseClient.auth.signInWithPassword({
        email: values.email.trim(),
        password: values.password,
      });
      if (response.error) throw response.error;
    }

    await openWorkspace(response.data.user);
    signupForm.reset();
  } catch (error) {
    signupError.textContent = error.message || "Could not complete sign-in.";
  } finally {
    authSubmit.disabled = false;
  }
}

async function handleAppForm(event) {
  const form = event.target;
  if (!(form instanceof HTMLFormElement)) return;

  if (form.id === "course-form") {
    event.preventDefault();
    const values = formValues(form);
    const name = values.name.trim();
    const duplicate = state.courses.some(
      (course) => course.name.toLocaleLowerCase() === name.toLocaleLowerCase()
    );
    if (!name || duplicate) {
      form.querySelector("#course-error").textContent = duplicate
        ? "That course is already in your list."
        : "Enter a course name.";
      return;
    }

    state.courses.push({ id: makeId(), name, code: values.code.trim(), held: 0, attended: 0 });
    if (await saveState()) {
      renderPage();
      appMessage.textContent = "Course added.";
    }
  }

  if (form.id === "task-form") {
    event.preventDefault();
    const values = formValues(form);
    if (!values.title.trim()) {
      form.querySelector("#task-error").textContent = "Enter a task title.";
      return;
    }
    if (values.deadline < values.dateAssigned) {
      form.querySelector("#task-error").textContent = "The due date cannot be before the date assigned.";
      return;
    }

    state.tasks.push({
      id: makeId(),
      courseId: values.courseId,
      title: values.title.trim(),
      type: values.type,
      description: values.description.trim(),
      dateAssigned: values.dateAssigned,
      deadline: values.deadline,
      priority: values.priority,
      status: "Pending",
    });
    if (await saveState()) {
      renderPage();
      appMessage.textContent = "Task added.";
    }
  }

  if (form.id === "note-form") {
    event.preventDefault();
    const values = formValues(form);
    if (!values.topic.trim() || !values.content.trim()) {
      form.querySelector("#note-error").textContent = "Enter both a topic and a note.";
      return;
    }
    state.notes.push({
      id: makeId(),
      courseId: values.courseId,
      date: values.date,
      topic: values.topic.trim(),
      content: values.content.trim(),
    });
    if (await saveState()) {
      renderPage();
      appMessage.textContent = "Note saved.";
    }
  }

  if (form.id === "profile-form") {
    event.preventDefault();
    const values = formValues(form);
    const profile = {
      name: values.name.trim(),
      studentNumber: values.studentNumber.trim(),
      institution: values.institution.trim(),
      program: values.program.trim(),
      yearOfStudy: values.yearOfStudy.trim(),
      semester: values.semester.trim(),
    };
    if (Object.values(profile).some((value) => !value)) {
      form.querySelector("#profile-error").textContent = "Please fill in every field.";
      return;
    }
    state.profile = profile;
    if (await saveState()) {
      renderPage();
      appMessage.textContent = "Profile updated.";
    }
  }
}

async function handleAppClick(event) {
  const pageButton = event.target.closest("[data-page]");
  if (pageButton && appShell.contains(pageButton)) {
    showApp(pageButton.dataset.page);
    return;
  }

  const actionButton = event.target.closest("[data-action]");
  if (!actionButton) return;

  const id = actionButton.dataset.id;
  const action = actionButton.dataset.action;

  if (action === "record-attendance") {
    const course = getCourse(id);
    if (!course) return;
    course.held += 1;
    if (actionButton.dataset.result === "present") course.attended += 1;
    if (await saveState()) {
      renderPage();
      appMessage.textContent = "Attendance recorded.";
    }
  }

  if (action === "delete-course") {
    const course = getCourse(id);
    if (!course || !window.confirm(`Remove ${course.name} and its tasks and notes?`)) return;
    state.courses = state.courses.filter((item) => item.id !== id);
    state.tasks = state.tasks.filter((task) => task.courseId !== id);
    state.notes = state.notes.filter((note) => note.courseId !== id);
    if (await saveState()) {
      renderPage();
      appMessage.textContent = "Course and related entries removed.";
    }
  }

  if (action === "toggle-task") {
    const task = state.tasks.find((item) => item.id === id);
    if (!task) return;
    task.status = task.status === "Completed" ? "Pending" : "Completed";
    if (await saveState()) {
      renderPage();
      appMessage.textContent = task.status === "Completed" ? "Task marked complete." : "Task reopened.";
    }
  }

  if (action === "delete-task") {
    const task = state.tasks.find((item) => item.id === id);
    if (!task || !window.confirm(`Remove "${task.title}"?`)) return;
    state.tasks = state.tasks.filter((item) => item.id !== id);
    if (await saveState()) {
      renderPage();
      appMessage.textContent = "Task removed.";
    }
  }

  if (action === "delete-note") {
    const note = state.notes.find((item) => item.id === id);
    if (!note || !window.confirm(`Remove the note "${note.topic}"?`)) return;
    state.notes = state.notes.filter((item) => item.id !== id);
    if (await saveState()) {
      renderPage();
      appMessage.textContent = "Note removed.";
    }
  }

  if (action === "clear-local-workspace") {
    if (!window.confirm("Delete the old local copy from this browser? The Supabase workspace will not be changed.")) return;
    try {
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      legacyWorkspaceAvailable = false;
      renderPage();
      appMessage.textContent = "Old browser copy removed.";
    } catch (error) {
      appMessage.textContent = "Could not remove the old browser copy. " + error.message;
    }
  }

  if (action === "delete-workspace") {
    if (!window.confirm("Delete the cloud workspace data for this account and sign out? This cannot be undone.")) return;
    try {
      const { error } = await supabaseClient
        .from("workspaces")
        .delete()
        .eq("user_id", currentUser.id);
      if (error) throw error;

      state = emptyState();
      lastSavedState = emptyState();
      const { error: signOutError } = await supabaseClient.auth.signOut();
      currentUser = null;
      signupForm.reset();
      setAuthMode("signin");
      showLanding();
      signupError.textContent = signOutError
        ? "Workspace deleted, but sign-out failed: " + signOutError.message
        : "Cloud workspace deleted. Your account is still active.";
    } catch (error) {
      appMessage.textContent = "Could not delete the cloud workspace. " + error.message;
    }
  }
}

async function handleSignOut() {
  try {
    const { error } = await supabaseClient.auth.signOut();
    if (error) throw error;
    currentUser = null;
    state = emptyState();
    lastSavedState = emptyState();
    signupForm.reset();
    setAuthMode("signin");
    showLanding();
    signupError.textContent = "You have signed out.";
  } catch (error) {
    appMessage.textContent = "Could not sign out. " + error.message;
  }
}

function start() {
  signupForm.addEventListener("submit", handleSignup);
  appContent.addEventListener("submit", handleAppForm);
  appContent.addEventListener("click", handleAppClick);
  document.querySelector(".app-nav").addEventListener("click", handleAppClick);
  document.querySelector("#back-home").addEventListener("click", showLanding);
  document.querySelector("#sign-out").addEventListener("click", handleSignOut);
  document.querySelector("#auth-mode-toggle").addEventListener("click", () => {
    setAuthMode(authMode === "signup" ? "signin" : "signup");
    signupError.textContent = "";
  });
  setAuthMode("signup");
  initializeSupabase();
}

start();
