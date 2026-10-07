/* =========================================================
   QUIZ MODULE (ER Diagram + SQL)
   Fully self-contained. Does not touch entities/relationships
   or any globals used by script.js / extra.js.

   - Practice Quiz  = real scored quiz
   - Competitive Exams = plain browsable question bank
                          (no scoring, no submit, no retry)
   ========================================================= */

(function () {

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
          explain: "ON DELETE CASCADE automatically deletes all child rows that reference the deleted parent row, keeping referential integrity intact." },

        /* ---------- GATE (adapted) ---------- */
        { exam: "GATE", year: "adapted",
          q: "Two entities E1 and E2 (each with a key and only single-valued attributes) have an M:N relationship. What is the minimum number of tables needed to represent this in the relational model?",
          answer: "3",
          explain: "An M:N relationship needs its own table holding the keys of both entities, plus one table for each entity: 2 + 1 = 3." },

        { exam: "GATE", year: "adapted",
          q: "R(A,B,C,D) has the FDs AB → C, C → D, D → A. Which are the candidate keys of R?",
          answer: "AB, BC and BD",
          explain: "B never appears on the right side, so every key must contain B. AB, BC and BD each have closure {A,B,C,D}, and none can be reduced further." },

        { exam: "GATE", year: "adapted",
          q: "In an ER diagram, the participation of a weak entity set in its identifying relationship is always:",
          answer: "Total",
          explain: "A weak entity cannot exist without its owner entity, so every weak-entity instance must take part in the identifying relationship (total participation)." },

        { exam: "GATE", year: "adapted",
          q: "Table R has 10 tuples and table S has 20 tuples. How many tuples does R CROSS JOIN S return?",
          answer: "200",
          explain: "A cross join pairs every row of R with every row of S, giving 10 × 20 = 200 tuples." },

        { exam: "GATE", year: "adapted",
          q: "Which query lists departments that have more than 5 employees from Emp(eid, name, dept)?",
          answer: "SELECT dept FROM Emp GROUP BY dept HAVING COUNT(*) > 5;",
          explain: "Group the rows by dept, then use HAVING to filter the groups on the aggregate. WHERE cannot use COUNT(*)." },

        { exam: "GATE", year: "adapted",
          q: "A decomposition of R into R1 and R2 is lossless-join if and only if the common attributes (R1 ∩ R2) satisfy which condition?",
          answer: "R1 ∩ R2 functionally determines R1 or R2 (it is a key of at least one of them)",
          explain: "For a binary decomposition, the join is lossless when R1 ∩ R2 → R1 or R1 ∩ R2 → R2 holds in the original relation." },

        { exam: "GATE", year: "adapted",
          q: "R(A,B,C) has A as its only candidate key. How many super keys does R have?",
          answer: "4",
          explain: "Every super key must contain A. The other attributes B and C are free: 2² = 4 super keys (A, AB, AC, ABC)." },

        { exam: "GATE", year: "adapted",
          q: "What does the SQL expression NULL = NULL evaluate to?",
          answer: "UNKNOWN",
          explain: "Any comparison with NULL gives UNKNOWN, not TRUE. Use IS NULL to test for NULL." },

        { exam: "GATE", year: "adapted",
          q: "Entities E1 and E2 have a 1:N relationship (E2 is on the N side) and E2 has total participation. What is the minimum number of tables needed?",
          answer: "2",
          explain: "The relationship is merged into the N-side table as a foreign key, so only E1 and E2 need tables." },

        /* ---------- TANCET (adapted) ---------- */
        { exam: "TANCET", year: "adapted",
          q: "Which SQL operator is used for pattern matching on strings?",
          answer: "LIKE",
          explain: "LIKE works with the wildcards % (any number of characters) and _ (exactly one character)." },

        { exam: "TANCET", year: "adapted",
          q: "Which command removes a table's structure together with all its data permanently?",
          answer: "DROP TABLE",
          explain: "DROP TABLE deletes the table definition and its rows. DELETE removes only rows and TRUNCATE empties the table but keeps its structure." },

        { exam: "TANCET", year: "adapted",
          q: "What is the cardinality of the relationship works_for between EMPLOYEE and DEPARTMENT, where many employees work in one department?",
          answer: "N:1 (many-to-one)",
          explain: "Many employees map to a single department, so the cardinality from EMPLOYEE to DEPARTMENT is N:1." },

        { exam: "TANCET", year: "adapted",
          q: "Which of the following is a DDL command?",
          answer: "ALTER",
          explain: "CREATE, ALTER and DROP are DDL commands. SELECT is DQL, and INSERT, UPDATE and DELETE are DML." },

        { exam: "TANCET", year: "adapted",
          q: "A column has some NULL values. How do COUNT(*) and COUNT(column) differ?",
          answer: "COUNT(*) counts all rows; COUNT(column) ignores NULL values",
          explain: "COUNT(*) counts every row, while COUNT(column) counts only rows where that column is not NULL." },

        { exam: "TANCET", year: "adapted",
          q: "In a 1:N relationship, an attribute of the relationship can be moved to which side?",
          answer: "The N-side entity",
          explain: "Each N-side instance takes part in at most one relationship instance, so the relationship attribute can be stored in that entity's table." },

        { exam: "TANCET", year: "adapted",
          q: "How is an identifying relationship (of a weak entity) shown in an ER diagram?",
          answer: "A double diamond",
          explain: "Weak entities use a double rectangle and their identifying relationship uses a double diamond." },

        { exam: "TANCET", year: "adapted",
          q: "What is the difference between UNION and UNION ALL?",
          answer: "UNION removes duplicate rows; UNION ALL keeps them",
          explain: "UNION combines the results and eliminates duplicates. UNION ALL keeps every row and is usually faster." },

        /* ---------- PSU (adapted) ---------- */
        { exam: "PSU", year: "adapted",
          q: "What is the default sorting order of ORDER BY in SQL?",
          answer: "Ascending",
          explain: "ORDER BY sorts in ascending order unless DESC is specified." },

        { exam: "PSU", year: "adapted",
          q: "Which symbol is used for an ISA (specialization / generalization) relationship in an ER diagram?",
          answer: "A triangle",
          explain: "An ISA relationship connects a superclass to its subclasses and is drawn as a triangle." },

        { exam: "PSU", year: "adapted",
          q: "A relation is in 2NF but has a transitive dependency. Which normal form does it fail?",
          answer: "3NF",
          explain: "3NF requires that no non-key attribute depends on another non-key attribute, so a transitive dependency violates 3NF." },

        { exam: "PSU", year: "adapted",
          q: "Which SQL command gives a user permission to access a table?",
          answer: "GRANT",
          explain: "GRANT assigns privileges to users and REVOKE takes them back." },

        { exam: "PSU", year: "adapted",
          q: "Which statement adds a new column email to the table Student?",
          answer: "ALTER TABLE Student ADD email VARCHAR(50);",
          explain: "ALTER TABLE ... ADD changes an existing table's structure by adding a column." },

        { exam: "PSU", year: "adapted",
          q: "What is a view in SQL?",
          answer: "A virtual table defined by a stored query",
          explain: "A view stores a SELECT query, not data. Its result is computed from the base tables when it is used." },

        { exam: "PSU", year: "adapted",
          q: "What is the primary key of the table created for an M:N relationship?",
          answer: "The combination of the primary keys of both participating entities",
          explain: "The junction table uses the two foreign keys together as a composite primary key, so each pairing appears only once." },

        { exam: "PSU", year: "adapted",
          q: "What does NATURAL JOIN do?",
          answer: "Joins two tables automatically on all columns with the same name",
          explain: "NATURAL JOIN matches columns with the same name in both tables and shows each common column once." },

        /* ---------- DRDO (adapted) ---------- */
        { exam: "DRDO", year: "adapted",
          q: "Employee(eid, name, manager_id) stores each employee's manager id. Which technique lists each employee with the manager's name?",
          answer: "A self join of Employee with itself",
          explain: "Joining Employee to an alias of itself (manager_id = eid) lets the same table play both employee and manager." },

        { exam: "DRDO", year: "adapted",
          q: "Which integrity rule says that no primary-key attribute can be NULL?",
          answer: "Entity integrity",
          explain: "Entity integrity guarantees every row can be identified, so a primary key can never be NULL." },

        { exam: "DRDO", year: "adapted",
          q: "Why is SELECT dept, name, COUNT(*) FROM Emp GROUP BY dept invalid in standard SQL?",
          answer: "name is neither in GROUP BY nor inside an aggregate function",
          explain: "Every selected column must be a grouping column or be aggregated. name has many values per dept." },

        { exam: "DRDO", year: "adapted",
          q: "What does SELECT name FROM Emp WHERE salary > (SELECT AVG(salary) FROM Emp); return?",
          answer: "Names of employees earning more than the average salary",
          explain: "The inner query computes the average once, and the outer query keeps rows above it." },

        { exam: "DRDO", year: "adapted",
          q: "In relational algebra, which operator picks rows and which picks columns?",
          answer: "Selection (σ) picks rows; Projection (π) picks columns",
          explain: "σ filters tuples by a condition and π keeps only the listed attributes." },

        { exam: "DRDO", year: "adapted",
          q: "How is a multivalued attribute mapped when converting an ER diagram to tables?",
          answer: "Into a separate table containing the entity's primary key and the attribute",
          explain: "Each value gets its own row, with the entity's key as a foreign key, so every column stays single-valued." },

        /* ---------- BHEL (adapted) ---------- */
        { exam: "BHEL", year: "adapted",
          q: "Which of these breaks First Normal Form?",
          answer: "A column storing multiple values, such as a list of phone numbers in one cell",
          explain: "1NF requires atomic (indivisible) values in every column." },

        { exam: "BHEL", year: "adapted",
          q: "Which SQL constraint restricts the values a column can accept using a condition, for example age >= 18?",
          answer: "CHECK",
          explain: "A CHECK constraint rejects any row whose value does not satisfy the given condition." },

        { exam: "BHEL", year: "adapted",
          q: "How is a derived attribute drawn in an ER diagram?",
          answer: "A dashed oval",
          explain: "Derived attributes, such as Age computed from Date of Birth, are drawn with a dashed oval." },

        { exam: "BHEL", year: "adapted",
          q: "Is the range in BETWEEN 10 AND 20 inclusive?",
          answer: "Yes, both 10 and 20 are included",
          explain: "BETWEEN a AND b is the same as >= a AND <= b." },

        { exam: "BHEL", year: "adapted",
          q: "How is a key attribute shown in an ER diagram?",
          answer: "An oval with its name underlined",
          explain: "The underline marks the attribute that uniquely identifies the entity." },

        { exam: "BHEL", year: "adapted",
          q: "Which JOIN produces every combination of rows from two tables without an ON condition?",
          answer: "CROSS JOIN",
          explain: "CROSS JOIN returns the Cartesian product of both tables." }
    ];


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

    if (!quizContainer || !examBankList) return;

    let activeQuestions = [];
    let correctlySolved = new Set();


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


    function updatePracticeHint() {
        const diff = quizDifficulty.value;
        const available = practiceBank[diff] ? practiceBank[diff].length : 0;
        quizCountHint.textContent = `${available} question(s) available at this difficulty.`;
        quizCount.max = available;
        if (parseInt(quizCount.value, 10) > available) quizCount.value = available;
    }

    quizDifficulty.addEventListener("change", updatePracticeHint);
    updatePracticeHint();


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

                    card.querySelectorAll("input[type=radio]").forEach(input => input.disabled = true);
                    submitBtn.disabled = true;
                    submitBtn.textContent = "Answered";

                } else {

                    feedbackBox.style.display = "block";
                    feedbackBox.className = "quiz-feedback quiz-feedback-wrong";
                    feedbackBox.innerHTML = `<strong>You're yet to get the answer. Try again!</strong>`;

                }

            });

        });

        const finishBtn = document.createElement("button");
        finishBtn.type = "button";
        finishBtn.className = "quiz-finish-btn primary-btn";
        finishBtn.textContent = "Finish & See Score";
        finishBtn.addEventListener("click", showScoreboard);

        quizContainer.appendChild(finishBtn);
    }


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


    function clearQuizArea() {
        quizContainer.innerHTML = "";
        quizScoreboard.style.display = "none";
        quizScoreboard.innerHTML = "";
        activeQuestions = [];
        correctlySolved = new Set();
    }


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


    /* =========================================================
       COMPETITIVE EXAMS AS ITS OWN TOP TAB
       Wrapped in try/catch so that if anything here does not
       match your page, the normal Quiz page keeps working.
       ========================================================= */
    try {

        const quizView = quizContainer.closest(".view");
        const quizNavBtn = Array.from(document.querySelectorAll(".main-nav .nav-btn"))
            .find(btn => btn.textContent.trim() === "Quiz");

        if (quizView && quizNavBtn) {

            // 1. new page for competitive exams
            const examView = document.createElement("div");
            examView.id = "examView";
            examView.className = "view";
            examView.innerHTML = `
                <section class="panel info-page">
                    <div class="panel-title">
                        <div>
                            <h2>Competitive Exams</h2>
                            <p>Question bank for ER modeling and SQL, in the style of GATE, TANCET, PSU, DRDO and BHEL papers.</p>
                        </div>
                    </div>
                </section>
            `;
            quizView.parentNode.insertBefore(examView, quizView.nextSibling);

            // 2. move the exam bank out of the Quiz page
            const examPanel = examView.querySelector(".info-page");
            examPanel.appendChild(examBankSetup);
            examPanel.appendChild(examBankList);
            examBankSetup.style.display = "";
            examBankList.style.display = "";

            // 3. hide the old Practice / Competitive switch buttons
            quizModePracticeBtn.style.display = "none";
            quizModeExamBtn.style.display = "none";
            const switchRow = quizModePracticeBtn.parentElement;
            if (switchRow && switchRow.children.length === 2) {
                switchRow.style.display = "none";
            }
            practiceSetup.style.display = "";
            quizContainer.style.display = "";

            // 4. new nav button right after "Quiz"
            const examNavBtn = document.createElement("button");
            examNavBtn.className = "nav-btn";
            examNavBtn.setAttribute("data-view", "examView");
            examNavBtn.textContent = "Competitive Exams";
            quizNavBtn.after(examNavBtn);

            examNavBtn.addEventListener("click", () => {
                document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
                examNavBtn.classList.add("active");
                document.querySelectorAll(".view").forEach(v => v.classList.remove("active-view"));
                examView.classList.add("active-view");
                renderExamBank();
            });
        }

    } catch (err) {
        console.error("Competitive Exams tab setup failed:", err);
    }

})();
