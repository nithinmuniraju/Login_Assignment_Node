module.exports = (sequelizeConfig, Sequelize) => {
    const registerSchema = sequelizeConfig.define("register", {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        first_name: {
            type: Sequelize.STRING,
            allowNull: false,
            validate: {
                is: /^[A-Za-z0-9]*$/i,
                notEmpty: true,
            }
        },
        last_name: {
            type: Sequelize.STRING,
            allowNull: true,
            validate: {
                is: /^[A-Za-z0-9]*$/i
            }
        },
        address: {
            type: Sequelize.TEXT,
            validate: {
                is: /^[a-zA-Z0-9\s,.'-]{3,}$/,
                notEmpty: true,
            }
        },
        mobile_no: {
            type: Sequelize.STRING,
            allowNull: false,
            validate: {
                isNumeric: true,
                notEmpty: true,
            }
        },
        password: {
            type: Sequelize.STRING,
            allowNull: false,
            validate: {
                notEmpty: true,
            }
        },
        email: {
            type: Sequelize.STRING,
            allowNull: false,
            unique: true,
            validate: {
                isEmail: {
                    msg: "Must be a valid email address",
                }
            }
        }
    });
    return registerSchema;
};