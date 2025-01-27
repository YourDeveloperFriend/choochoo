import { JSONB } from "@sequelize/core/_non-semver-use-at-your-own-risk_/data-types.js";
import type { Migration } from "../scripts/migrations";

export const up: Migration = async ({ context: queryInterface }) => {
  await queryInterface.addColumn("Games", "variant", {
    type: JSONB,
    allowNull: true,
  });
  await queryInterface.sequelize.query(`UPDATE "Games" set variant = '{}';`);
  await queryInterface.changeColumn("Games", "variant", {
    type: JSONB,
    allowNull: false,
  });
  await queryInterface.sequelize.query(
    `UPDATE "Games" set variant = CONCAT('{"gameKey": "', "gameKey", '"}')::json;`,
  );
  await queryInterface.sequelize.query(
    `UPDATE "Games" set variant = (CONCAT('{"gameKey": "', "gameKey", '", "locoVariant": true}')::json) where "gameKey" = 'ireland';`,
  );
};

export const down: Migration = async ({ context: queryInterface }) => {
  await queryInterface.removeColumn("Games", "variant");
};
