-- Clean database schema for odoo_hackathon

--1. Users table
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password TEXT NOT NULL, -- hashed
    location VARCHAR(100),
    location_type VARCHAR(10) CHECK (location_type IN ('remote', 'local')),
    availability_type VARCHAR(20) CHECK (availability_type IN ('weekends', 'weekdays', 'evenings', 'flexible')),
    about TEXT DEFAULT '',
    rating NUMERIC(2,1) DEFAULT 0,
    
    -- Privacy settings
    is_public BOOLEAN DEFAULT TRUE,            -- show profile in swappers list
    show_location BOOLEAN DEFAULT TRUE,        -- show location publicly
    show_email BOOLEAN DEFAULT FALSE,          -- show email to others
    
    -- Admin + metadata
    is_banned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

--2. Skills table
CREATE TABLE skills (
    skill_id SERIAL PRIMARY KEY,
    skill_name VARCHAR(100) NOT NULL UNIQUE,
    skill_category VARCHAR(50),
    skill_description TEXT,
    is_approved BOOLEAN DEFAULT FALSE, -- Admin must approve skill description
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

--3. User skills offered table
CREATE TABLE user_skills_offered (
    user_skill_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    skill_id INT REFERENCES skills(skill_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, skill_id)
);

--4. User skills wanted table
CREATE TABLE user_skills_wanted (
    user_skill_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    skill_id INT REFERENCES skills(skill_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, skill_id)
);

--5. Swap requests table
CREATE TABLE swap_requests (
    swap_id SERIAL PRIMARY KEY,
    requester_id INT REFERENCES users(user_id),
    responder_id INT REFERENCES users(user_id),
    skill_offered_id INT REFERENCES user_skills_offered(user_skill_id),
    skill_wanted_id INT REFERENCES user_skills_offered(user_skill_id),
    status VARCHAR(20) DEFAULT 'pending',  -- pending, accepted, rejected, cancelled
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

--6. User ban logs table
CREATE TABLE user_ban_logs (
    log_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    admin_id INT REFERENCES users(user_id),  -- The admin who banned/unbanned
    action VARCHAR(10) CHECK (action IN ('ban', 'unban')),
    reason TEXT,
    action_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

--7. Platform policies table
CREATE TABLE platform_policies (
    policy_id SERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    content TEXT NOT NULL,
    effective_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

--8. User ratings table
CREATE TABLE user_ratings (
    rating_id SERIAL PRIMARY KEY,
    rated_user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    rater_user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    swap_id INT REFERENCES swap_requests(swap_id),
    rating SMALLINT CHECK (rating BETWEEN 1 AND 5),
    feedback TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- FUNCTIONS

--1. Insert user function
CREATE OR REPLACE FUNCTION insert_user(
    p_name VARCHAR,
    p_email VARCHAR,
    p_password TEXT,
    p_location VARCHAR DEFAULT NULL,
    p_location_type VARCHAR DEFAULT NULL,
    p_availability_type VARCHAR DEFAULT NULL,
    p_is_public BOOLEAN DEFAULT TRUE,
    p_show_location BOOLEAN DEFAULT TRUE,
    p_show_email BOOLEAN DEFAULT FALSE,
    p_about TEXT DEFAULT '',
    p_rating NUMERIC(2,1) DEFAULT 0
) RETURNS INTEGER AS $$
DECLARE
    new_user_id INTEGER;
BEGIN
    INSERT INTO users (
        name, email, password,
        location, location_type, availability_type,
        is_public, show_location, show_email,
        about, rating
    )
    VALUES (
        p_name, p_email, p_password,
        p_location, p_location_type, p_availability_type,
        p_is_public, p_show_location, p_show_email,
        p_about, p_rating
    )
    RETURNING user_id INTO new_user_id;

    RETURN new_user_id;

EXCEPTION
    WHEN unique_violation THEN
        RAISE NOTICE 'Email % already exists.', p_email;
        RETURN NULL;
END;
$$ LANGUAGE plpgsql;

--2. Get swappers function
CREATE OR REPLACE FUNCTION get_swappers(
    p_user_name TEXT DEFAULT NULL,
    p_skill_search TEXT DEFAULT NULL,
    p_skill_category TEXT DEFAULT NULL,
    p_location VARCHAR DEFAULT NULL
) RETURNS TABLE (
    user_id INT,
    name VARCHAR,
    email VARCHAR,
    location VARCHAR,
    availability_type VARCHAR,
    skill_name VARCHAR,
    skill_category VARCHAR,
    rating NUMERIC(2,1)
) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT
        u.user_id,
        u.name,
        CASE WHEN u.show_email THEN u.email ELSE NULL END AS email,
        u.location,
        u.availability_type,
        s.skill_name,
        s.skill_category,
        u.rating
    FROM users u
    JOIN user_skills_offered uso ON uso.user_id = u.user_id
    JOIN skills s ON s.skill_id = uso.skill_id
    WHERE u.is_banned = FALSE
      AND u.is_public = TRUE
      -- User name filter
      AND (p_user_name IS NULL OR LOWER(u.name) LIKE LOWER('%' || p_user_name || '%'))
      -- Skill name or category filter
      AND (
          (p_skill_search IS NULL OR LOWER(s.skill_name) LIKE LOWER('%' || p_skill_search || '%'))
          OR
          (p_skill_category IS NULL OR LOWER(s.skill_category) = LOWER(p_skill_category))
      )
      -- Location filter (optional)
      AND (
          p_location IS NULL
          OR LOWER(u.location) = LOWER(p_location)
      )
    ORDER BY u.rating DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql;

--3. Update about and privacy function
CREATE OR REPLACE FUNCTION update_about_and_privacy(
    p_user_id INT,
    p_about TEXT,
    p_is_public BOOLEAN,
    p_show_location BOOLEAN,
    p_show_email BOOLEAN
) RETURNS VOID AS $$
BEGIN
    UPDATE users
    SET about = p_about,
        is_public = p_is_public,
        show_location = p_show_location,
        show_email = p_show_email
    WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

--4. Update availability function
CREATE OR REPLACE FUNCTION update_availability(
    p_user_id INT,
    p_availability_type VARCHAR,
    p_location_type VARCHAR,
    p_location VARCHAR
) RETURNS VOID AS $$
BEGIN
    UPDATE users
    SET availability_type = p_availability_type,
        location_type = p_location_type,
        location = p_location
    WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

--5. Add skill offered function
CREATE OR REPLACE FUNCTION add_skill_offered(
    p_user_id INT,
    p_skill_id INT
) RETURNS VOID AS $$
BEGIN
    INSERT INTO user_skills_offered (user_id, skill_id)
    VALUES (p_user_id, p_skill_id)
    ON CONFLICT (user_id, skill_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

--6. Add skill wanted function
CREATE OR REPLACE FUNCTION add_skill_wanted(
    p_user_id INT,
    p_skill_id INT
) RETURNS VOID AS $$
BEGIN
    INSERT INTO user_skills_wanted (user_id, skill_id)
    VALUES (p_user_id, p_skill_id)
    ON CONFLICT (user_id, skill_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

--7. Remove skill offered function
CREATE OR REPLACE FUNCTION remove_skill_offered(
    p_user_id INT,
    p_skill_id INT
) RETURNS VOID AS $$
BEGIN
    DELETE FROM user_skills_offered
    WHERE user_id = p_user_id AND skill_id = p_skill_id;
END;
$$ LANGUAGE plpgsql;

--8. Remove skill wanted function
CREATE OR REPLACE FUNCTION remove_skill_wanted(
    p_user_id INT,
    p_skill_id INT
) RETURNS VOID AS $$
BEGIN
    DELETE FROM user_skills_wanted
    WHERE user_id = p_user_id AND skill_id = p_skill_id;
END;
$$ LANGUAGE plpgsql;

--9. Ban user function
CREATE OR REPLACE FUNCTION ban_user(
    p_user_id INT,
    p_admin_id INT,
    p_reason TEXT
) RETURNS VOID AS $$
BEGIN
    UPDATE users SET is_banned = TRUE WHERE user_id = p_user_id;
    
    INSERT INTO user_ban_logs (user_id, admin_id, action, reason)
    VALUES (p_user_id, p_admin_id, 'ban', p_reason);
END;
$$ LANGUAGE plpgsql;

--10. Unban user function
CREATE OR REPLACE FUNCTION unban_user(
    p_user_id INT,
    p_admin_id INT,
    p_reason TEXT DEFAULT 'Unbanned by admin'
) RETURNS VOID AS $$
BEGIN
    UPDATE users SET is_banned = FALSE WHERE user_id = p_user_id;
    
    INSERT INTO user_ban_logs (user_id, admin_id, action, reason)
    VALUES (p_user_id, p_admin_id, 'unban', p_reason);
END;
$$ LANGUAGE plpgsql;

-- Insert sample data
INSERT INTO skills (skill_name, skill_category, skill_description, is_approved) VALUES
('JavaScript', 'Programming', 'Modern JavaScript development', true),
('Python', 'Programming', 'Python programming language', true),
('React', 'Web Development', 'React.js frontend framework', true),
('Node.js', 'Backend Development', 'Server-side JavaScript', true),
('SQL', 'Database', 'Structured Query Language', true),
('Git', 'Version Control', 'Git version control system', true),
('Docker', 'DevOps', 'Containerization platform', true),
('AWS', 'Cloud Computing', 'Amazon Web Services', true),
('Machine Learning', 'Data Science', 'Machine learning algorithms', true),
('UI/UX Design', 'Design', 'User interface and experience design', true);

-- Insert sample users
INSERT INTO users (name, email, password, location, location_type, availability_type, about, rating) VALUES
('John Doe', 'john@example.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4tbQJ8qKGi', 'New York', 'remote', 'weekends', 'Full-stack developer with 5 years experience', 4.5),
('Jane Smith', 'jane@example.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4tbQJ8qKGi', 'San Francisco', 'local', 'weekdays', 'Frontend specialist and UI/UX designer', 4.8),
('Mike Johnson', 'mike@example.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4tbQJ8qKGi', 'London', 'remote', 'evenings', 'Backend developer and DevOps engineer', 4.2),
('Sarah Wilson', 'sarah@example.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4tbQJ8qKGi', 'Toronto', 'local', 'flexible', 'Data scientist and ML engineer', 4.7),
('Alex Brown', 'alex@example.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4tbQJ8qKGi', 'Berlin', 'remote', 'weekends', 'Mobile app developer and cloud architect', 4.0); 