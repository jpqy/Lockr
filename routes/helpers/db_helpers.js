const bcrypt = require("bcrypt");

module.exports = (db) => {
  /**
   * Get a single user from the db given their email.
   * @param {String} email The email of the user.
   * @return {Promise<{}>} A promise to the user.
   */
  const getUserWithEmail = function (email) {
    return db
      .query(
        `
        SELECT * FROM users
        WHERE email=$1
        LIMIT 1;
        `,
        [email]
      )
      .then((res) => {
        if (res.rows.length === 0) return null;
        return res.rows[0];
      });
  };

  /**
   * Check if a user exists with a given username and password
   * @param {String} email
   * @param {String} password encrypted
   */
  const login = function (email, password) {
    return getUserWithEmail(email) //Test
      .then((user) => {
        if (bcrypt.compareSync(password, user.password)) {
          return user;
        }
        return null;
      });
  };

  /**
   * Add a new user to the database.
   * @param {{first_name: string, last_name:string, password: string, email: string}} user
   * @return {Promise<{}>} A promise to the user.
   */
  const addUser = function (user) {
    return db
      .query(
        `
        INSERT INTO users
        (first_name, last_name, email, password)
        VALUES
        ($1, $2, $3, $4)
        RETURNING *;
        `,
        [
          user.first_name,
          user.last_name,
          user.email,
          bcrypt.hashSync(user.password, 12),
        ]
      )
      .then((res) => res.rows[0])
      .catch((e) => null);
  };

  /**
   * Get a single user from the database given their id.
   * @param {string} id The id of the user.
   * @return {Promise<{}>} A promise to the user.
   */
  const getUserWithId = function (id) {
    return db
      .query(
        `
        SELECT * FROM users
        WHERE id=$1::integer
        LIMIT 1;
        `,
        [id]
      )
      .then((res) => {
        if (res.rows.length === 0) return null;
        return res.rows[0];
      });
  };

  /**
   * Get an array of orgs the user belongs to from the database
   * @param {string} id The id of the user.
   * @return {Promise<{}>} A promise to the user.
   */
  const getOrgsWithUserId = function (id) {
    if (!id) return null;
    return db
      .query(
        `
        SELECT * FROM users
        JOIN membership ON user_id=users.id
        JOIN org on org_id=org.id
        WHERE users.id=$1::integer AND is_active=true;
        `,
        [id]
      )
      .then((res) => {
        if (res.rows.length === 0) return null;
        return res.rows;
      })
      .catch((e) => {
        return e;
      });
  };

  /** 
  /* Get a list of users from the given organization id.
   * @param {integer} org The org id of the user.
   * @return {Promise<{}>} A promise to the user.
   */
  const getUsersByOrg = function (id) {
    return db
      .query(
        `
        SELECT users.first_name, users.last_name, users.email FROM users
        JOIN membership ON users.id = user_id
        JOIN org ON org.id = org_id
        WHERE org.id = $1 AND is_active = true;
        `,
        [id]
      )
      .then((res) => res.rows)
      .catch((e) => console.error(e));
  };

    /**
   * Check password id against user id to make sure that user is allowed to access that password
   * @param {integer} user_id The id of the user.
   * @param {integer} pwd_id The id of the password.
   * @return {Promise<{}>} A promise to the user.
   */
  const checkAuthGetPwd = function (user_id, pwd_id) {
    return db
      .query(
        `
      SELECT * FROM users 
      JOIN membership ON users.id = user_id
      JOIN org ON org.id = membership.org_id
      JOIN pwd ON pwd.org_id = org.id
      WHERE membership.user_id = $1 AND pwd.id = $2 AND membership.is_active = true
    `,
        [user_id, pwd_id]
      )
      .then((res) => {
        if (res.rows.length === 0) {
          return false;
        } else {
          return res.rows[0];
        }
      })
    }
  /**
   * Add a new org to the database.
   * @param {name: string} org
   * @param {name: string} user
   * @return {Promise<{}>} A promise to the user.
   */
  const addOrg = function (org, user) {
    return db
      .query(
        `
        INSERT INTO org
        (name)
        VALUES
        ($1)
        RETURNING *;
        `,
        [org.name]
      )
      .then((data) => {
        const newOrg = data.rows[0];
        // Make membership entry
        db.query(
          `
          INSERT INTO membership
          (user_id, org_id, is_admin)
          VALUES
          ($1, $2, true)
          RETURNING *;
          `,
          [user.id, newOrg.id]
        )
          .then((res) => res.rows[0])
          .catch((e) => console.error(e));
      })
      .catch((e) => console.error(e));
  };

  /**
   * Find passwords using org id and user id
   * @param {name: integer} org_id
   * @param {name: integer} user_id
   * @return {Promise<{}>} A promise to the user.
   */
  const getPwdByOrgID = function (org_id, user_id) {
    return db
      .query(
        `
    SELECT pwd.* , membership.is_active FROM pwd
    JOIN membership ON membership.org_id = pwd.org_id
    WHERE membership.org_id = $1::integer
    AND membership.user_id = $2::integer
    AND membership.is_active = true;
    `,
        [org_id, user_id]
      )
      .then((res) => {
        if (res.rows.length === 0) return null;
        return res.rows;
      })
      .catch((e) => console.error(e));
  };

  return {
    getUserWithEmail,
    login,
    addUser,
    getUserWithId,
    getUsersByOrg,
    getOrgsWithUserId,
    checkAuthGetPwd,
    addOrg,
    getPwdByOrgID,
  };
};
