import { DataTypes } from '@sequelize/core';
import type { Migration } from '../scripts/migrations';

export const up: Migration = async ({ context: queryInterface }) => {
  await queryInterface.addColumn('GameHistories', 'seed', DataTypes.STRING);
}

export const down: Migration = async ({ context: queryInterface }) => {
  await queryInterface.removeColumn('GameHistories', 'seed');
}
