import type { Migration } from "../scripts/migrations";

export const up: Migration = async ({ context: queryInterface }) => {
  await queryInterface.sequelize.query(
    `UPDATE "Games" set variant = '{"gameKey": "cyprus", "version": 2012}'::json where "gameKey" = 'cyprus';`,
  );
};

export const down: Migration = async ({ context: queryInterface }) => {
  await queryInterface.sequelize.query(
    `UPDATE "Games" set variant = '{"gameKey": "cyprus"}'::json where "gameKey" = 'cyprus';`,
  );
};
