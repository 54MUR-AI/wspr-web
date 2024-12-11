import {
  Model,
  DataTypes,
  Optional,
  BelongsToGetAssociationMixin,
  BelongsToSetAssociationMixin,
  Association
} from 'sequelize';
import { sequelize } from '../database';
import { User } from './User';

interface MessageTemplateAttributes {
  id: string;
  userId: string;
  name: string;
  content: string;
  category?: string;
  tags: string[];
  isShared: boolean;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

interface MessageTemplateCreationAttributes
  extends Optional<MessageTemplateAttributes, 'id' | 'tags' | 'isShared' | 'metadata'> {}

class MessageTemplate extends Model<MessageTemplateAttributes, MessageTemplateCreationAttributes>
  implements MessageTemplateAttributes {
  public id!: string;
  public userId!: string;
  public name!: string;
  public content!: string;
  public category!: string | undefined;
  public tags!: string[];
  public isShared!: boolean;
  public metadata!: Record<string, any>;
  public createdAt!: Date;
  public updatedAt!: Date;

  // Associations
  public getUser!: BelongsToGetAssociationMixin<User>;
  public setUser!: BelongsToSetAssociationMixin<User, string>;

  public readonly user?: User;

  public static associations: {
    user: Association<MessageTemplate, User>;
  };
}

MessageTemplate.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    category: {
      type: DataTypes.STRING,
      allowNull: true
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    isShared: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false
    }
  },
  {
    sequelize,
    tableName: 'MessageTemplates',
    modelName: 'MessageTemplate'
  }
);

// Define associations
MessageTemplate.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

export { MessageTemplate };
