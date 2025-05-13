import "reflect-metadata";
import { DataSource } from "typeorm";
import dotenv from "dotenv";
import path from "path";

dotenv.config();


const PostgresDataSource = new DataSource({
  type: "postgres",
  host: process.env.DATABASE_HOST,
  port:  5432,
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME  ,   
  synchronize: false,
  logging: true,
  entities: [path.join(__dirname, "models", "*.{ts,js}")],
  migrationsTableName: "migrations",
  migrations: [path.join(__dirname, "migrations", "*.{ts,js}")],
  subscribers: [path.join(__dirname, "subscribers", "*.{ts,js}")],
});


PostgresDataSource.initialize()
  .then(() => {
    console.log("Data Source has been initialized!");
  })
  .catch((err) => {
    console.error("Error during Data Source initialization", err);
  });

export default PostgresDataSource;
