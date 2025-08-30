/* eslint-disable ts/consistent-type-definitions */
declare module '#auth-utils' {
  interface User {
    id: number;
    name: string;
  }

  interface UserSession {
    lastLoggedIn: Date;
  }

}

export {};
