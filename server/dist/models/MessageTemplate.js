"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageTemplate = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../database");
const User_1 = require("./User");
class MessageTemplate extends sequelize_1.Model {
}
exports.MessageTemplate = MessageTemplate;
MessageTemplate.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true
    },
    userId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'Users',
            key: 'id'
        }
    },
    name: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false
    },
    content: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false
    },
    category: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true
    },
    tags: {
        type: sequelize_1.DataTypes.ARRAY(sequelize_1.DataTypes.STRING),
        defaultValue: []
    },
    isShared: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: false
    },
    metadata: {
        type: sequelize_1.DataTypes.JSONB,
        defaultValue: {}
    },
    createdAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false
    },
    updatedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false
    }
}, {
    sequelize: database_1.sequelize,
    tableName: 'MessageTemplates',
    modelName: 'MessageTemplate'
});
// Define associations
MessageTemplate.belongsTo(User_1.User, {
    foreignKey: 'userId',
    as: 'user'
});
