--1
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password TEXT NOT NULL, -- hashed
    location VARCHAR(100),
    location_type VARCHAR(10) CHECK (location_type IN ('remote', 'local')),
    availability_type VARCHAR(20) CHECK (availability_type IN ('weekends', 'weekdays', 'evenings', 'flexible')),
    
    -- 🔐 Privacy settings
    is_public BOOLEAN DEFAULT TRUE,            -- show profile in swappers list
    show_location BOOLEAN DEFAULT TRUE,        -- show location publicly
    show_email BOOLEAN DEFAULT FALSE,          -- show email to others
    
    -- 🛡️ Admin + metadata
    is_banned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
drop table users;
drop table user_skills_offered;
--2
CREATE TABLE skills (
    skill_id SERIAL PRIMARY KEY,
    skill_name VARCHAR(100) NOT NULL UNIQUE,
    skill_category VARCHAR(50),
    skill_description TEXT,
    is_approved BOOLEAN DEFAULT FALSE, -- Admin must approve skill description
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
--3
CREATE TABLE user_skills_offered (
    user_skill_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    skill_id INT REFERENCES skills(skill_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, skill_id)
);
--4
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
--5
CREATE TABLE user_ban_logs (
    log_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    admin_id INT REFERENCES users(user_id),  -- The admin who banned/unbanned
    action VARCHAR(10) CHECK (action IN ('ban', 'unban')),
    reason TEXT,
    action_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
--6 platform policy table
CREATE TABLE platform_policies (
    policy_id SERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    content TEXT NOT NULL,
    effective_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE user_ratings (
    rating_id SERIAL PRIMARY KEY,
    rated_user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    rater_user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    swap_id INT REFERENCES swap_requests(swap_id),
    rating SMALLINT CHECK (rating BETWEEN 1 AND 5),
    feedback TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_skills_wanted (
    user_skill_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    skill_id INT REFERENCES skills(skill_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, skill_id)
);


--FUNCTIONS
--1 INSERTION INTO USERS TABLE
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



--2 get swappers function
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
--3
--update about and privacy
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
--4
--update availability function
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
--5
--add skill offered
CREATE OR REPLACE FUNCTION add_skill_offered(
    p_user_id INT,
    p_skill_id INT
) RETURNS VOID AS $$
BEGIN
    INSERT INTO user_skills_offered(user_id, skill_id)
    VALUES (p_user_id, p_skill_id)
    ON CONFLICT (user_id, skill_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;
--6 add skill wanted
CREATE OR REPLACE FUNCTION add_skill_wanted(
    p_user_id INT,
    p_skill_id INT
) RETURNS VOID AS $$
BEGIN
    INSERT INTO user_skills_wanted(user_id, skill_id)
    VALUES (p_user_id, p_skill_id)
    ON CONFLICT (user_id, skill_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;
--7 remove skill offered
CREATE OR REPLACE FUNCTION remove_skill_offered(
    p_user_id INT,
    p_skill_id INT
) RETURNS VOID AS $$
BEGIN
    DELETE FROM user_skills_offered
    WHERE user_id = p_user_id AND skill_id = p_skill_id;
END;
$$ LANGUAGE plpgsql;
--8 remove skill wanted
CREATE OR REPLACE FUNCTION remove_skill_wanted(
    p_user_id INT,
    p_skill_id INT
) RETURNS VOID AS $$
BEGIN
    DELETE FROM user_skills_wanted
    WHERE user_id = p_user_id AND skill_id = p_skill_id;
END;
$$ LANGUAGE plpgsql;



--views
--1 profile searched by others
CREATE OR REPLACE VIEW user_profile_view AS
SELECT
    u.user_id,
    u.name,
    u.location,
    u.rating,
    u.about,
    
    -- Skills offered (comma-separated)
    COALESCE(
        (SELECT STRING_AGG(s.skill_name, ', ')
         FROM user_skills_offered uso
         JOIN skills s ON s.skill_id = uso.skill_id
         WHERE uso.user_id = u.user_id),
        'None'
    ) AS skills_offered,
    
    -- Skills wanted (comma-separated)
    COALESCE(
        (SELECT STRING_AGG(s.skill_name, ', ')
         FROM user_skills_wanted usw
         JOIN skills s ON s.skill_id = usw.skill_id
         WHERE usw.user_id = u.user_id),
        'None'
    ) AS skills_wanted,
    
    -- Total skills taught
    (SELECT COUNT(DISTINCT sr.skill_offered_id)
     FROM swap_requests sr
     WHERE sr.responder_id = u.user_id AND sr.status = 'accepted') AS total_skills_taught,
    
    -- Total skills learned
    (SELECT COUNT(DISTINCT sr.skill_wanted_id)
     FROM swap_requests sr
     WHERE sr.requester_id = u.user_id AND sr.status = 'accepted') AS total_skills_learned,
    
    -- Number of reviews
    (SELECT COUNT(*) FROM user_ratings ur WHERE ur.rated_user_id = u.user_id) AS number_of_reviews,
    
    -- Recent feedback (latest 1)
    (SELECT ur.feedback
     FROM user_ratings ur
     WHERE ur.rated_user_id = u.user_id
     ORDER BY ur.created_at DESC
     LIMIT 1) AS recent_feedback,
    
    -- Recent swap details (latest 1)
    (SELECT 'Swap with ' || other_user.name || ' on ' || s.skill_name
     FROM swap_requests sr
     JOIN user_skills_offered uso ON uso.user_skill_id = sr.skill_offered_id
     JOIN skills s ON s.skill_id = uso.skill_id
     JOIN users other_user ON other_user.user_id = sr.responder_id
     WHERE sr.requester_id = u.user_id
     ORDER BY sr.created_at DESC
     LIMIT 1) AS recent_swap

FROM users u
WHERE u.is_banned = FALSE AND u.is_public = TRUE;

--2
--when my profile pressed
CREATE OR REPLACE VIEW my_profile_view AS
SELECT
    u.user_id,
    u.name,
    u.email,
    u.location,
    u.location_type,
    u.availability_type,
    u.about,
    u.rating,
    u.is_public,
    u.show_location,
    u.show_email,

    -- Skills Offered
    COALESCE((
        SELECT STRING_AGG(s.skill_name, ', ')
        FROM user_skills_offered uso
        JOIN skills s ON s.skill_id = uso.skill_id
        WHERE uso.user_id = u.user_id
    ), 'None') AS skills_offered,

    -- Skills Wanted
    COALESCE((
        SELECT STRING_AGG(s.skill_name, ', ')
        FROM user_skills_wanted usw
        JOIN skills s ON s.skill_id = usw.skill_id
        WHERE usw.user_id = u.user_id
    ), 'None') AS skills_wanted,

    -- Stats
    (SELECT COUNT(*) FROM swap_requests sr WHERE sr.requester_id = u.user_id AND sr.status = 'accepted') AS skills_learned,
    (SELECT COUNT(*) FROM swap_requests sr WHERE sr.responder_id = u.user_id AND sr.status = 'accepted') AS skills_taught,
    (SELECT COUNT(*) FROM user_ratings ur WHERE ur.rated_user_id = u.user_id) AS total_reviews,

    -- Recent Activity
    (SELECT feedback FROM user_ratings ur WHERE ur.rated_user_id = u.user_id ORDER BY created_at DESC LIMIT 1) AS recent_feedback,
    (SELECT 'Swap with ' || other_u.name || ' on ' || s.skill_name
     FROM swap_requests sr
     JOIN user_skills_offered uso ON sr.skill_offered_id = uso.user_skill_id
     JOIN skills s ON s.skill_id = uso.skill_id
     JOIN users other_u ON sr.responder_id = other_u.user_id
     WHERE sr.requester_id = u.user_id
     ORDER BY sr.created_at DESC LIMIT 1) AS recent_swap

FROM users u
WHERE u.is_banned = FALSE;





-- ALTERATIONS
--1 IN USERS TABLE
ALTER TABLE users
ADD COLUMN rating NUMERIC(2,1) CHECK (rating >= 0 AND rating <= 5) DEFAULT 0;
-- 2 in users table
ALTER TABLE users ADD COLUMN about TEXT DEFAULT '';



--admin functions
--2 function to ban user
CREATE OR REPLACE FUNCTION ban_user(
    p_user_id INT,
    p_admin_id INT,
    p_reason TEXT
) RETURNS VOID AS $$
BEGIN
    UPDATE users
    SET is_banned = TRUE,
        ban_reason = p_reason,
        banned_at = CURRENT_TIMESTAMP
    WHERE user_id = p_user_id;
    
    INSERT INTO user_ban_logs (user_id, admin_id, action, reason)
    VALUES (p_user_id, p_admin_id, 'ban', p_reason);
END;
$$ LANGUAGE plpgsql;

--3 function to unban
CREATE OR REPLACE FUNCTION unban_user(
    p_user_id INT,
    p_admin_id INT,
    p_reason TEXT DEFAULT 'Unbanned by admin'
) RETURNS VOID AS $$
BEGIN
    UPDATE users
    SET is_banned = FALSE,
        ban_reason = NULL,
        banned_at = NULL
    WHERE user_id = p_user_id;
    
    INSERT INTO user_ban_logs (user_id, admin_id, action, reason)
    VALUES (p_user_id, p_admin_id, 'unban', p_reason);
END;
$$ LANGUAGE plpgsql;
drop table users;

--insertion of data
--1 users table
INSERT INTO users (
    name, email, password, location, location_type, availability_type,
    is_public, show_location, show_email, rating, about
)
VALUES
('Ananya R', 'ananya@example.com', 'hashed_pw_1', 'Kochi', 'local', 'weekends', TRUE, TRUE, FALSE, 4.5, 'Loves teaching yoga and meditation.'),
('Rajesh Kumar', 'rajesh@example.com', 'hashed_pw_2', 'Chennai', 'remote', 'weekdays', TRUE, FALSE, FALSE, 3.8, 'Enthusiastic about coding and data structures.'),
('Sara Iqbal', 'sara@example.com', 'hashed_pw_3', 'Delhi', 'local', 'evenings', FALSE, TRUE, TRUE, 4.9, 'Artist and illustrator. Here to learn UX design.'),
('Manoj Menon', 'manoj@example.com', 'hashed_pw_4', 'Bangalore', 'remote', 'flexible', TRUE, TRUE, TRUE, 4.2, 'Full-stack developer willing to teach MERN stack.'),
('Divya S', 'divya@example.com', 'hashed_pw_5', 'Mumbai', 'local', 'weekends', TRUE, TRUE, FALSE, 4.0, 'Excited to learn more about AI and share math knowledge.');
--2 skills
INSERT INTO skills (skill_name, skill_category, skill_description, is_approved)
VALUES
('Python Programming', 'Programming', 'Learn and teach Python basics and advanced concepts.', TRUE),
('Guitar', 'Music', 'Learn to play acoustic and electric guitar.', TRUE),
('Graphic Design', 'Design', 'Basics of graphic design using Photoshop and Illustrator.', TRUE),
('Public Speaking', 'Communication', 'Improve confidence and speech delivery skills.', TRUE),
('Yoga', 'Health & Wellness', 'Practice and teach yoga techniques and meditation.', TRUE);
-- other
-- User 1: Ananya R (offers Yoga, wants Graphic Design)
INSERT INTO user_skills_offered (user_id, skill_id) VALUES (1, 5);
INSERT INTO user_skills_wanted (user_id, skill_id) VALUES (1, 3);

-- User 2: Rajesh Kumar (offers Python Programming, wants Public Speaking)
INSERT INTO user_skills_offered (user_id, skill_id) VALUES (2, 1);
INSERT INTO user_skills_wanted (user_id, skill_id) VALUES (2, 4);

-- User 3: Sara Iqbal (offers Graphic Design, wants Guitar)
INSERT INTO user_skills_offered (user_id, skill_id) VALUES (3, 3);
INSERT INTO user_skills_wanted (user_id, skill_id) VALUES (3, 2);

-- User 4: Manoj Menon (offers Python Programming, wants Yoga)
INSERT INTO user_skills_offered (user_id, skill_id) VALUES (4, 1);
INSERT INTO user_skills_wanted (user_id, skill_id) VALUES (4, 5);

-- User 5: Divya S (offers Public Speaking, wants Python Programming)
INSERT INTO user_skills_offered (user_id, skill_id) VALUES (5, 4);
INSERT INTO user_skills_wanted (user_id, skill_id) VALUES (5, 1);

--swap requests ratings feedback


-- Swap 1: Rajesh teaches Python to Divya; Divya teaches Public Speaking to Rajesh
INSERT INTO swap_requests (requester_id, responder_id, skill_offered_id, skill_wanted_id, status)
VALUES 
(5, 2, (SELECT user_skill_id FROM user_skills_offered WHERE user_id = 5 AND skill_id = 4),
    (SELECT user_skill_id FROM user_skills_offered WHERE user_id = 2 AND skill_id = 1),
    'accepted');

-- Swap 2: Manoj teaches Python to Ananya; Ananya teaches Yoga to Manoj
INSERT INTO swap_requests (requester_id, responder_id, skill_offered_id, skill_wanted_id, status)
VALUES 
(1, 4, (SELECT user_skill_id FROM user_skills_offered WHERE user_id = 1 AND skill_id = 5),
    (SELECT user_skill_id FROM user_skills_offered WHERE user_id = 4 AND skill_id = 1),
    'accepted');

-- Add ratings for those swaps
INSERT INTO user_ratings (rated_user_id, rater_user_id, swap_id, rating, feedback)
VALUES
(2, 5, 1, 5, 'Rajesh was very patient and clear in teaching Python!'),
(5, 2, 1, 4, 'Divya helped improve my public speaking skills.'),
(4, 1, 2, 5, 'Manoj explained Python concepts very well.'),
(1, 4, 2, 5, 'Ananya had  yoga sessions which  were refreshing and helpful.');
select * from swap_requests;
delete from swap_requests where swap_id=6;
-- Restart sequence at 1
ALTER SEQUENCE swap_requests_swap_id_seq RESTART WITH 1;
