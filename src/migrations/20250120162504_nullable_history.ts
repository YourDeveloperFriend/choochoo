import { DataTypes } from '@sequelize/core';
import type { Migration } from '../scripts/migrations';

export const up: Migration = async ({ context: queryInterface }) => {
  await queryInterface.changeColumn('GameHistories', 'previousGameData', { type: DataTypes.TEXT, allowNull: true });
  await queryInterface.changeColumn('GameHistories', 'patch', { type: DataTypes.TEXT, allowNull: true });
  await queryInterface.changeColumn('GameHistories', 'actionName', { type: DataTypes.STRING, allowNull: true });
  await queryInterface.changeColumn('GameHistories', 'actionData', { type: DataTypes.STRING, allowNull: true });
  await queryInterface.changeColumn('GameHistories', 'userId', { type: DataTypes.INTEGER, allowNull: true });
}

export const down: Migration = async ({ context: queryInterface }) => {
  await queryInterface.changeColumn('GameHistories', 'previousGameData', { type: DataTypes.TEXT, allowNull: false });
  await queryInterface.changeColumn('GameHistories', 'patch', { type: DataTypes.TEXT, allowNull: false });
  await queryInterface.changeColumn('GameHistories', 'actionName', { type: DataTypes.STRING, allowNull: false });
  await queryInterface.changeColumn('GameHistories', 'actionData', { type: DataTypes.STRING, allowNull: false });
  await queryInterface.changeColumn('GameHistories', 'userId', { type: DataTypes.INTEGER, allowNull: false });
}