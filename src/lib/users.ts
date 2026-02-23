import bcrypt from 'bcrypt';

interface User {
  id: number | string;
  username: string;
  passwordHash: string;
  role: 'admin' | 'user' | 'employee';
  email: string;
}

let users: User[] = [];
let initialized = false;

/** Initialize admin/user accounts from env vars (called once) */
export async function getUsers(): Promise<User[]> {
  if (initialized) return users;
  initialized = true;
  users = [];

  const adminUsername = process.env.AdminUsername;
  const adminPassword = process.env.AdminPassword;
  const userUsername = process.env.UserUsername;
  const userPassword = process.env.UserPassword;

  if (adminUsername && adminPassword) {
    const adminHash = await bcrypt.hash(adminPassword, 10);
    users.push({
      id: 1,
      username: adminUsername,
      passwordHash: adminHash,
      role: 'admin',
      email: `${adminUsername.toLowerCase()}@waterblob.com`,
    });
  }

  if (userUsername && userPassword) {
    const userHash = await bcrypt.hash(userPassword, 10);
    users.push({
      id: 2,
      username: userUsername,
      passwordHash: userHash,
      role: 'user',
      email: `${userUsername.toLowerCase()}@waterblob.com`,
    });
  }

  return users;
}
