-- The regular database: employees (with their registration) and accesses.
-- Runs once, when the database volume is created (files run in name order).

CREATE TYPE level AS ENUM ('ANALYST', 'MANAGER', 'MINISTER');
CREATE TYPE employee_status AS ENUM ('PROCESSING', 'UNDER_REVIEW', 'ACTIVE', 'REJECTED');

-- The employee id ("funcional"): MMA-000100, MMA-000101...
CREATE SEQUENCE employee_number START 100;

CREATE TABLE employees (
    id            text PRIMARY KEY DEFAULT 'MMA-' || lpad(nextval('employee_number')::text, 6, '0'),
    name          text NOT NULL,
    level         level NOT NULL,
    status        employee_status NOT NULL DEFAULT 'PROCESSING',
    -- Why it was rejected: no-face, captures-differ, already-registered, not-approved...
    status_reason text,
    registered_at timestamptz NOT NULL DEFAULT now(),
    approved_by   text REFERENCES employees (id),
    approved_at   timestamptz
);

CREATE INDEX employees_status ON employees (status);

CREATE TABLE accesses (
    id          bigserial PRIMARY KEY,
    employee_id text NOT NULL REFERENCES employees (id),
    accessed_at timestamptz NOT NULL DEFAULT now(),
    -- How similar the face was to the registered one (cosine similarity).
    match       real NOT NULL
);

-- The base minister: signs in with a password (api/set_base_password.py) and
-- approves the ministers. Approvals made with that password are recorded
-- as approved by this employee.
INSERT INTO employees (id, name, level, status, approved_at)
VALUES ('MMA-000001', 'Ministro(a) base', 'MINISTER', 'ACTIVE', now());
