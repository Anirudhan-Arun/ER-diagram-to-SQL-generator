/* =========================================================
   QUIZ MODULE (ER Diagram + SQL)
   Fully self-contained. Does not touch entities/relationships
   or any globals used by script.js / extra.js.

   - Practice Quiz  = real scored quiz (unchanged behaviour)
   - Competitive Exams = plain browsable question bank
                          (no scoring, no submit, no retry)
   ========================================================= */

(function () {

    /* ---------------------------------------------------
       QUESTION BANK — Practice Quiz (Easy / Medium / Hard)
       --------------------------------------------------- */

    const practiceBank = {

        easy: [
            { q: "What does 'ER' stand for in ER Diagram?",
              options: ["Entity-Relationship", "Entity-Record", "Element-Relation", "Entry-Reference"],
              correct: 0,
              explain: "ER stands for Entity-Relationship, a model used to describe the structure of a database using entities and the relationships between them." },

            { q: "Which shape represents an Entity in standard ER notation?",
              options: ["Oval", "Diamond", "Rectangle", "Triangle"],
              correct: 2,
              explain: "Entities are represented using rectangles in standard ER notation." },

            { q: "Which shape represents an Attribute in an ER diagram?",
              options: ["Rectangle", "Oval / Ellipse", "Diamond", "Hexagon"],
              correct: 1,
              explain: "Attributes are represented using ovals (ellipses) connected to their entity or relationship." },

            { q: "Which shape represents a Relationship in an ER diagram?",
              options: ["Rectangle", "Oval", "Diamond", "Circle"],
              correct: 2,
              explain: "Relationships between entities are represented using diamonds." },

            { q: "Which SQL command is used to retrieve data from a table?",
              options: ["GET", "FETCH", "SELECT", "RETRIEVE"],
              correct: 2,
              explain: "SELECT is the SQL statement used to query and retrieve data from one or more tables." },

            { q: "What is a Primary Key?",
              options: [
                "A key that can have duplicate values",
                "A column that uniquely identifies each record in a table",
                "A key used only for encryption",
                "A key found only in relationship tables"
              ],
              correct: 1,
              explain: "A primary key uniquely identifies each row/record in a table and cannot contain NULL or duplicate values." },

            { q: "Which SQL keyword removes duplicate rows from a result set?",
              options: ["UNIQUE", "DISTINCT", "REMOVE", "FILTER"],
              correct: 1,
              explain: "DISTINCT is used in a SELECT statement to eliminate duplicate rows from the result." },

            { q: "In a 1:N (one-to-many) relationship, what does the 'N' side mean?",
              options: [
                "One record on the many side relates to one on the other side",
                "Many records on this side can relate to a single record on the other side",
                "There is no relationship",
                "Both sides must have equal records"
              ],
              correct: 1,
              explain: "In a 1:N relationship, one record on the '1' side can be associated with many records on the 'N' side." },

            { q: "Which SQL clause is used to filter rows based on a condition?",
              options: ["ORDER BY", "GROUP BY", "WHERE", "HAVING"],
              correct: 2,
              explain: "WHERE filters individual rows before any grouping is applied." },

            { q: "What is a Foreign Key?",
              options: [
                "A key that has no relation to any table",
                "A column that references the primary key of another table",
                "A key that is always encrypted",
                "The first column in every table"
              ],
              correct: 1,
              explain: "A foreign key is a column (or set of columns) in one table that references the primary key of another table, enforcing a link between the two." }
        ],

        medium: [
            { q: "When converting a Many-to-Many (M:N) relationship to a relational schema, what is typically created?",
              options: [
                "A foreign key on one side only",
                "A separate junction (bridge) table with foreign keys to both entities",
                "No extra table is needed",
                "A trigger"
              ],
              correct: 1,
              explain: "M:N relationships cannot be represented with a simple foreign key, so a junction table is created holding foreign keys referencing both participating entities." },

            { q: "Which normal form removes partial dependency on a composite primary key?",
              options: ["1NF", "2NF", "3NF", "BCNF"],
              correct: 1,
              explain: "Second Normal Form (2NF) requires that every non-key attribute be fully functionally dependent on the whole primary key, removing partial dependencies." },

            { q: "Which SQL clause is used with aggregate functions to group rows sharing a value?",
              options: ["WHERE", "GROUP BY", "ORDER BY", "JOIN"],
              correct: 1,
              explain: "GROUP BY groups rows that share a value in specified columns so aggregate functions (COUNT, SUM, AVG...) can be applied per group." },

            { q: "Which JOIN returns all rows from the left table, and matched rows from the right table (NULLs where there is no match)?",
              options: ["INNER JOIN", "RIGHT JOIN", "LEFT JOIN", "CROSS JOIN"],
              correct: 2,
              explain: "LEFT JOIN returns every row from the left table, filling in NULLs for right-table columns when there's no match." },

            { q: "A weak entity depends on which of the following for its existence?",
              options: [
                "Another weak entity",
                "A strong (owner) entity via an identifying relationship",
                "The database engine",
                "Nothing, it is independent"
              ],
              correct: 1,
              explain: "A weak entity cannot be uniquely identified by its own attributes alone and depends on a strong 'owner' entity through an identifying relationship." },

            { q: "How is a multivalued attribute typically shown in an ER diagram?",
              options: ["Single oval", "Double oval", "Dashed oval", "Diamond"],
              correct: 1,
              explain: "A multivalued attribute (one that can take multiple values) is represented with a double oval." },

            { q: "What is a composite key?",
              options: [
                "A key made of exactly one column",
                "A primary key formed by combining two or more columns",
                "A key that is always a foreign key",
                "A key generated automatically only"
              ],
              correct: 1,
              explain: "A composite key uses two or more columns together to uniquely identify a row, when no single column can do so alone." },

            { q: "What is the key difference between WHERE and HAVING in SQL?",
              options: [
                "They are identical",
                "WHERE filters rows before grouping; HAVING filters groups after aggregation",
                "HAVING can only be used with SELECT *",
                "WHERE only works with numbers"
              ],
              correct: 1,
              explain: "WHERE filters individual rows before GROUP BY is applied, while HAVING filters aggregated groups after GROUP BY." },

            { q: "What does referential integrity ensure in a relational database?",
              options: [
                "Every table has exactly one row",
                "A foreign key value must match an existing primary key value (or be NULL)",
                "All columns must be of type INTEGER",
                "Tables cannot be joined"
              ],
              correct: 1,
              explain: "Referential integrity ensures foreign key values correspond to actual existing primary key values in the referenced table, preventing orphaned records." },

            { q: "For a 1:N relationship, where is the foreign key usually placed when converting to tables?",
              options: [
                "On the '1' side table",
                "On the 'N' (many) side table",
                "In a brand-new junction table",
                "It is not needed at all"
              ],
              correct: 1,
              explain: "In a 1:N relationship, the foreign key referencing the '1' side's primary key is placed on the 'many' side table." }
        ],

        hard: [
            { q: "How is a ternary (3-entity) relationship typically converted into relational tables?",
              options: [
                "It is ignored since only binary relationships can be modeled",
                "A new table is created holding foreign keys from all three participating entities",
                "One of the entities is deleted",
                "It becomes a 1:1 relationship automatically"
              ],
              correct: 1,
              explain: "A ternary relationship is converted into its own relation containing foreign keys referencing all three participating entities (plus any relationship attributes)." },

            { q: "What is a derived attribute? Give the classic example.",
              options: [
                "An attribute stored directly with no computation, e.g. name",
                "An attribute computed from another stored attribute, e.g. Age derived from Date of Birth",
                "An attribute that never appears in the ER diagram",
                "A multivalued attribute only"
              ],
              correct: 1,
              explain: "A derived attribute's value is calculated from other attributes rather than stored directly — Age from Date of Birth is the textbook example." },

            { q: "Which normal form eliminates transitive dependency between non-key attributes?",
              options: ["1NF", "2NF", "3NF", "1NF and 2NF only"],
              correct: 2,
              explain: "Third Normal Form (3NF) removes transitive dependencies, where a non-key attribute depends on another non-key attribute rather than directly on the primary key." },

            { q: "For a relation to be in Boyce-Codd Normal Form (BCNF), what must hold?",
              options: [
                "Every attribute must be numeric",
                "Every determinant in the relation must be a candidate key",
                "The table must have no foreign keys",
                "It must already be in 1NF only"
              ],
              correct: 1,
              explain: "BCNF is a stricter version of 3NF requiring that for every functional dependency X → Y, X must be a candidate key (a superkey)." },

            { q: "In ER notation, how is 'total participation' of an entity in a relationship usually distinguished from 'partial participation'?",
              options: [
                "Total participation uses a dashed line; partial uses a solid line",
                "Total participation uses a double line; partial participation uses a single line",
                "There is no visual distinction",
                "Total participation is shown in red only"
              ],
              correct: 1,
              explain: "Total participation (every entity instance must participate) is drawn with a double line; partial participation (optional) uses a single line." },

            { q: "Which combination of SQL clauses would you use to find the department with the highest employee count?",
              options: [
                "WHERE + DISTINCT",
                "GROUP BY department, then ORDER BY COUNT(*) DESC with LIMIT",
                "HAVING alone with no GROUP BY",
                "JOIN without any aggregation"
              ],
              correct: 1,
              explain: "You'd GROUP BY department, use COUNT(*) to get counts per group, ORDER BY that count descending, and LIMIT 1 to get the top department." },

            { q: "What is the key difference between DELETE and TRUNCATE in SQL?",
              options: [
                "They behave identically in every database",
                "DELETE removes rows one by one (can use WHERE, is logged, can be rolled back); TRUNCATE removes all rows at once with minimal logging and resets identity counters",
                "TRUNCATE can only remove one row at a time",
                "DELETE always removes the entire table structure"
              ],
              correct: 1,
              explain: "DELETE is a row-by-row operation that supports WHERE and can typically be rolled back; TRUNCATE deallocates all rows at once, is minimally logged, and usually resets auto-increment counters." },

            { q: "What is a correlated subquery?",
              options: [
                "A subquery that runs once, independent of the outer query",
                "A subquery that references a column from the outer query and is re-evaluated for each row of the outer query",
                "A subquery that can only appear in the FROM clause",
                "A subquery that never returns any rows"
              ],
              correct: 1,
              explain: "A correlated subquery depends on the outer query (it references an outer column), so conceptually it's executed once per row processed by the outer query." }
        ]
    };


    /* ---------------------------------------------------
       QUESTION BANK — Competitive Exams (browsable, not scored)
       Original practice questions, tagged with an
       illustrative exam name + year (NOT verbatim past
       papers — see disclaimer in the UI).
       --------------------------------------------------- */

    const examBank = [
        { exam: "GATE", year: 2023,
          q: "A relation R(A,B,C,D) has functional dependency A → B, A → C, A → D. What is the highest normal form R is guaranteed to satisfy given A is the only candidate key?",
          answer: "3NF and possibly BCNF",
          explain: "Since A is the sole candidate key and every other attribute depends directly on A (no partial or transitive dependency), R satisfies 2NF and 3NF, and BCNF as well since A is the only determinant." },

        { exam: "GATE", year: 2022,
          q: "Which of the following correctly describes a candidate key?",
          answer: "A minimal set of attributes that can uniquely identify a tuple in a relation",
          explain: "A candidate key is a minimal super key — a set of attributes that uniquely identifies each tuple, with no redundant attribute in the set." },

        { exam: "GATE", year: 2021,
          q: "When mapping an ER diagram with a 1:1 relationship where one entity has total participation and the other has partial participation, where should the foreign key ideally be placed?",
          answer: "On the entity with total participation",
          explain: "Placing the foreign key on the side with total participation avoids NULL foreign key values, since every row on that side is guaranteed to have a matching related row." },

        { exam: "TANCET", year: 2023,
          q: "Which SQL statement correctly returns the second highest salary from an Employee table (standard SQL)?",
          answer: "SELECT salary FROM Employee ORDER BY salary DESC LIMIT 1 OFFSET 1;",
          explain: "Ordering salaries descending and skipping the first row (OFFSET 1) with LIMIT 1 gives the second-highest value." },

        { exam: "TANCET", year: 2022,
          q: "In an ER diagram, a double-lined rectangle represents:",
          answer: "A weak entity",
          explain: "A weak entity, which depends on a strong (owner) entity for its identification, is drawn as a double-lined rectangle." },

        { exam: "TANCET", year: 2021,
          q: "Normalization is primarily used to:",
          answer: "Reduce data redundancy and avoid update/insert/delete anomalies",
          explain: "Normalization organizes columns and tables to minimize data redundancy and prevent anomalies during insert, update, and delete operations." },

        { exam: "PSU", year: 2023,
          q: "Which set of properties (ACID) guarantees that a transaction is either fully completed or fully rolled back?",
          answer: "Atomicity",
          explain: "Atomicity ensures a transaction is treated as a single indivisible unit — it either commits completely or has no effect at all." },

        { exam: "PSU", year: 2022,
          q: "Which JOIN returns only the rows that have matching values in both tables?",
          answer: "INNER JOIN",
          explain: "INNER JOIN returns only rows where the join condition is satisfied in both tables." },

        { exam: "PSU", year: 2021,
          q: "What does the SQL constraint 'NOT NULL' enforce on a column?",
          answer: "The column cannot store an empty/undefined value",
          explain: "NOT NULL simply requires that the column always has some value — it disallows NULL entries." },

        { exam: "DRDO", year: 2023,
          q: "Which relational algebra operation is used to combine tuples from two relations based on a common attribute?",
          answer: "Join (⋈)",
          explain: "The Join operation (⋈) combines related tuples from two relations, typically based on a common attribute value, similar to SQL's JOIN." },

        { exam: "DRDO", year: 2022,
          q: "Which SQL constraint ensures a foreign key value must exist as a primary key in the referenced table?",
          answer: "FOREIGN KEY ... REFERENCES",
          explain: "The FOREIGN KEY ... REFERENCES constraint enforces that values in the referencing column must match existing primary key values in the referenced table." },

        { exam: "DRDO", year: 2021,
          q: "What is the main purpose of an index in a database table?",
          answer: "To speed up data retrieval at the cost of some extra storage and slower writes",
          explain: "An index creates a fast lookup structure for a column (or columns), significantly speeding up SELECT queries, though it adds storage overhead and slightly slows INSERT/UPDATE/DELETE." },

        { exam: "BHEL", year: 2023,
          q: "In ER notation, an attribute that itself has sub-attributes (e.g. Address made of Street, City, Pincode) is called:",
          answer: "A composite attribute",
          explain: "A composite attribute can be broken down into smaller sub-parts, each of which is itself a simple attribute — e.g. Address splitting into Street, City, Pincode." },

        { exam: "BHEL", year: 2022,
          q: "Which SQL aggregate function returns the number of rows matching a condition?",
          answer: "COUNT()",
          explain: "COUNT() returns the number of rows (or non-NULL values in a column) that match the query." },

        { exam: "BHEL", year: 2021,
          q: "What happens to related child rows by default if a parent row is deleted and a foreign key has 'ON DELETE CASCADE'?",
          answer: "All matching child rows are automatically deleted too",
          explain: "ON DELETE CASCADE automatically deletes all child rows that reference the deleted parent row, keeping referential integrity intact." }
    ];


    /* ---------------------------------------------------
       DOM REFERENCES
       --------------------------------------------------- */

    const quizModePracticeBtn = document.getElementById("quizModePracticeBtn");
    const quizModeExamBtn = document.getElementById("quizModeExamBtn");

    const practiceSetup = document.getElementById("practiceSetup");
    const quizContainer = document.getElementById("quizContainer");
    const quizScoreboard = document.getElementById("quizScoreboard");

    const quizDifficulty = document.getElementById("quizDifficulty");
    const quizCount = document.getElementById("quizCount");
    const quizCountHint = document.getElementById("quizCountHint");
    const startQuizBtn = document.getElementById("startQuizBtn");

    const examBankSetup = document.getElementById("examBankSetup");
    const examBankFilter = document.getElementById("examBankFilter");
    const examBankSearch = document.getElementById("examBankSearch");
    const examBankHint = document.getElementById("examBankHint");
    const examBankList = document.getElementById("examBankList");

    // If the quiz section isn't on this page for some reason, bail safely.
    if (!quizContainer || !examBankList) return;

    let activeQuestions = [];        // currently running practice quiz set
    let correctlySolved = new Set(); // indices (within activeQuestions) solved correctly


    /* ---------------------------------------------------
       MODE TOGGLE
       --------------------------------------------------- */

    quizModePracticeBtn.addEventListener("click", () => {
        quizModePracticeBtn.classList.add("active");
        quizModeExamBtn.classList.remove("active");

        practiceSetup.style.display = "";
        quizContainer.style.display = "";

        examBankSetup.style.display = "none";
        examBankList.style.display = "none";

        clearQuizArea();
    });

    quizModeExamBtn.addEventListener("click", () => {
        quizModeExamBtn.classList.add("active");
        quizModePracticeBtn.classList.remove("active");

        examBankSetup.style.display = "";
        examBankList.style.display = "";

        practiceSetup.style.display = "none";
        quizContainer.style.display = "none";
        quizScoreboard.style.display = "none";
        quizScoreboard.innerHTML = "";

        renderExamBank();
    });


    /* ---------------------------------------------------
       HINT (how many practice questions are available)
       --------------------------------------------------- */

    function updatePracticeHint() {
        const diff = quizDifficulty.value;
        const available = practiceBank[diff] ? practiceBank[diff].length : 0;
        quizCountHint.textContent = `${available} question(s) available at this difficulty.`;
        quizCount.max = available;
        if (parseInt(quizCount.value, 10) > available) quizCount.value = available;
    }

    quizDifficulty.addEventListener("change", updatePracticeHint);
    updatePracticeHint();


    /* ---------------------------------------------------
       SHUFFLE HELPER
       --------------------------------------------------- */

    function shuffle(array) {
        const copy = array.slice();
        for (let i = copy.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [copy[i], copy[j]] = [copy[j], copy[i]];
        }
        return copy;
    }

    function escapeHTML(value) {
        return String(value)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }


    /* ---------------------------------------------------
       START PRACTICE QUIZ (scored, with retry)
       --------------------------------------------------- */

    startQuizBtn.addEventListener("click", () => {
        const diff = quizDifficulty.value;
        const pool = practiceBank[diff] || [];

        let count = parseInt(quizCount.value, 10);
        if (!count || count < 1) count = 1;
        if (count > pool.length) count = pool.length;

        if (pool.length === 0) {
            quizContainer.innerHTML = `<div class="empty-state">No questions available for this difficulty.</div>`;
            return;
        }

        activeQuestions = shuffle(pool).slice(0, count);
        correctlySolved = new Set();
        renderQuiz();
    });


    /* ---------------------------------------------------
       RENDER PRACTICE QUIZ QUESTIONS
       --------------------------------------------------- */

    function renderQuiz() {
        quizScoreboard.style.display = "none";
        quizScoreboard.innerHTML = "";

        quizContainer.innerHTML = "";

        activeQuestions.forEach((question, index) => {

            const card = document.createElement("div");
            card.className = "quiz-question-card";
            card.id = `quiz-q-${index}`;

            const optionsHTML = question.options.map((opt, optIndex) => `
                <label class="quiz-option-label">
                    <input type="radio" name="quiz-q-${index}-options" value="${optIndex}">
                    <span>${escapeHTML(opt)}</span>
                </label>
            `).join("");

            card.innerHTML = `
                <div class="quiz-question-header">
                    <span class="quiz-question-number">Q${index + 1}.</span>
                </div>
                <p class="quiz-question-text">${escapeHTML(question.q)}</p>
                <div class="quiz-options">${optionsHTML}</div>
                <button class="quiz-submit-btn primary-btn" type="button">Submit</button>
                <div class="quiz-feedback" style="display:none;"></div>
            `;

            quizContainer.appendChild(card);

            const submitBtn = card.querySelector(".quiz-submit-btn");
            const feedbackBox = card.querySelector(".quiz-feedback");

            submitBtn.addEventListener("click", () => {

                const selected = card.querySelector(`input[name="quiz-q-${index}-options"]:checked`);

                if (!selected) {
                    feedbackBox.style.display = "block";
                    feedbackBox.className = "quiz-feedback quiz-feedback-neutral";
                    feedbackBox.innerHTML = `<strong>Please select an option first.</strong>`;
                    return;
                }

                const chosenIndex = parseInt(selected.value, 10);

                if (chosenIndex === question.correct) {

                    correctlySolved.add(index);

                    feedbackBox.style.display = "block";
                    feedbackBox.className = "quiz-feedback quiz-feedback-correct";
                    feedbackBox.innerHTML = `
                        <strong>Yes! ✅</strong>
                        <p>${escapeHTML(question.explain)}</p>
                    `;

                    // Lock the question once correct
                    card.querySelectorAll("input[type=radio]").forEach(input => input.disabled = true);
                    submitBtn.disabled = true;
                    submitBtn.textContent = "Answered";

                } else {

                    // Wrong answer: don't reveal it's wrong, allow retry
                    feedbackBox.style.display = "block";
                    feedbackBox.className = "quiz-feedback quiz-feedback-wrong";
                    feedbackBox.innerHTML = `<strong>You're yet to get the answer. Try again!</strong>`;

                }

            });

        });

        // Finish button at the bottom
        const finishBtn = document.createElement("button");
        finishBtn.type = "button";
        finishBtn.className = "quiz-finish-btn primary-btn";
        finishBtn.textContent = "Finish & See Score";
        finishBtn.addEventListener("click", showScoreboard);

        quizContainer.appendChild(finishBtn);
    }


    /* ---------------------------------------------------
       SCOREBOARD (Practice Quiz only)
       --------------------------------------------------- */

    function showScoreboard() {
        const total = activeQuestions.length;
        const score = correctlySolved.size;
        const percent = total ? Math.round((score / total) * 100) : 0;

        const listHTML = activeQuestions.map((q, index) => {
            const solved = correctlySolved.has(index);
            return `
                <div class="quiz-score-item ${solved ? "solved" : "unsolved"}">
                    <span>${solved ? "✅" : "❌"} Q${index + 1}</span>
                    <span class="quiz-score-item-text">${escapeHTML(q.q.slice(0, 60))}${q.q.length > 60 ? "…" : ""}</span>
                </div>
            `;
        }).join("");

        quizScoreboard.style.display = "block";
        quizScoreboard.innerHTML = `
            <h3>Scoreboard</h3>
            <p class="quiz-score-summary">Score: <strong>${score} / ${total}</strong> (${percent}%)</p>
            <div class="quiz-score-list">${listHTML}</div>
            <button id="quizRetakeBtn" class="secondary-btn" type="button">Take Another Quiz</button>
        `;

        document.getElementById("quizRetakeBtn").addEventListener("click", () => {
            clearQuizArea();
            quizScoreboard.scrollIntoView({ behavior: "smooth", block: "start" });
        });

        quizScoreboard.scrollIntoView({ behavior: "smooth", block: "start" });
    }


    /* ---------------------------------------------------
       CLEAR (Practice Quiz only)
       --------------------------------------------------- */

    function clearQuizArea() {
        quizContainer.innerHTML = "";
        quizScoreboard.style.display = "none";
        quizScoreboard.innerHTML = "";
        activeQuestions = [];
        correctlySolved = new Set();
    }


    /* =====================================================
       COMPETITIVE EXAMS — PLAIN QUESTION BANK
       (no scoring, no submit button, no retry — just browse)
       ===================================================== */

    function getFilteredExamQuestions() {
        const examFilter = examBankFilter.value;
        const searchTerm = examBankSearch.value.trim().toLowerCase();

        return examBank.filter(item => {
            const matchesExam = examFilter === "ALL" || item.exam === examFilter;
            const matchesSearch = !searchTerm ||
                item.q.toLowerCase().includes(searchTerm) ||
                item.answer.toLowerCase().includes(searchTerm) ||
                item.explain.toLowerCase().includes(searchTerm);
            return matchesExam && matchesSearch;
        });
    }

    function renderExamBank() {
        const filtered = getFilteredExamQuestions();

        examBankHint.textContent = `${filtered.length} question(s) in the bank.`;

        if (filtered.length === 0) {
            examBankList.innerHTML = `<div class="empty-state">No questions match this filter/search.</div>`;
            return;
        }

        examBankList.innerHTML = "";

        filtered.forEach((item, index) => {

            const card = document.createElement("div");
            card.className = "exam-bank-card";

            card.innerHTML = `
                <div class="quiz-question-header">
                    <span class="quiz-question-number">Q${index + 1}.</span>
                    <span class="quiz-exam-tag">${escapeHTML(item.exam)} ${escapeHTML(String(item.year))}</span>
                </div>
                <p class="quiz-question-text">${escapeHTML(item.q)}</p>
                <button class="exam-bank-toggle-btn secondary-btn" type="button">Show Answer & Explanation</button>
                <div class="exam-bank-answer" style="display:none;">
                    <p><strong>Answer:</strong> ${escapeHTML(item.answer)}</p>
                    <p>${escapeHTML(item.explain)}</p>
                </div>
            `;

            examBankList.appendChild(card);

            const toggleBtn = card.querySelector(".exam-bank-toggle-btn");
            const answerBox = card.querySelector(".exam-bank-answer");

            toggleBtn.addEventListener("click", () => {
                const isOpen = answerBox.style.display === "block";
                answerBox.style.display = isOpen ? "none" : "block";
                toggleBtn.textContent = isOpen ? "Show Answer & Explanation" : "Hide Answer & Explanation";
            });

        });
    }

    examBankFilter.addEventListener("change", renderExamBank);
    examBankSearch.addEventListener("input", renderExamBank);

})();
