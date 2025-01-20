import { DataTypes } from '@sequelize/core';
import type { Migration } from '../scripts/migrations';

export const up: Migration = async ({ context: queryInterface }) => {
  await queryInterface.addColumn('GameHistories', 'seed', { type: DataTypes.STRING, allowNull: true });
}

export const down: Migration = async ({ context: queryInterface }) => {
  await queryInterface.removeColumn('GameHistories', 'seed');
}
