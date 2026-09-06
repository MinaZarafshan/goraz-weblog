create TABLE users(
    id SERIAL Primary Key,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP

);


create Table posts(
    title TEXT NOT NULL,
	id SERIAL PRIMARY KEY,
	content TEXT NOT NULL,
	image_path TEXT,
	author_id INTEGER REFERENCES users(id) NOT NULL,
    privacy TEXT NOT NULL CHECK (privacy IN ('public', 'private')),
	created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP


);

CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
    user_id INTEGER REFERENCES users(id) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE post_shares (
    post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
    user_id INTEGER REFERENCES users(id) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (post_id, user_id)
);
