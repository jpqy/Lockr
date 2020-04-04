DROP TABLE IF EXISTS usage
CASCADE;

CREATE TABLE usage
(
  id         SERIAL  PRIMARY KEY,
  user_id    INTEGER REFERENCES USER ON DELETE CASCADE,
  pwd_id     INTEGER REFERENCES pwd ON DELETE CASCADE,
  times_used INTEGER DEFAULT 0
);