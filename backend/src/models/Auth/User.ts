import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../index';


type UserAttributes = {
    user_id: number;
    email: string;
    password: string;
    status: boolean;
    last_login_at?: Date | null;
    created_at?: Date;
    updated_at?: Date;
};
type UserCreationAttributes = Optional<UserAttributes, 'user_id'>;

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
    declare user_id: number;
    declare email: string;
    declare password: string;
    declare status: boolean;
    declare last_login_at?: Date | null;
    declare created_at?: Date;
    declare updated_at?: Date;
}

User.init(
    {
        user_id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER,
        },
        email: {
            allowNull: false,
            type: DataTypes.STRING,
            unique: true,
        },
        password: {
            allowNull: false,
            type: DataTypes.STRING,
        },
        status: {
            allowNull: false,
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        last_login_at: {
            allowNull: true,
            type: DataTypes.DATE,
        },
        created_at: DataTypes.DATE,
        updated_at: DataTypes.DATE,
    },
    {
        tableName: 'user',
        sequelize,
        underscored: true,
        createdAt: false,
        updatedAt: false,
        hooks: {
            beforeCreate: (user, options) => {
                user.created_at = new Date();
                user.updated_at = new Date();
            },
            beforeUpdate: (user, options) => {
                user.updated_at = new Date();
            }
        }
    }
);

