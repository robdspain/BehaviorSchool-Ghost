const _ = require('lodash');
const Promise = require('bluebird');
const {i18n} = require('../../lib/common');
const logging = require('../../../shared/logging');
const db = require('../db');
const schema = require('./schema');
const clients = require('./clients');

function addTableColumn(tableName, table, columnName, columnSpec = schema[tableName][columnName]) {
    let column;

    // creation distinguishes between text with fieldtype, string with maxlength and all others
    if (columnSpec.type === 'text' && Object.prototype.hasOwnProperty.call(columnSpec, 'fieldtype')) {
        column = table[columnSpec.type](columnName, columnSpec.fieldtype);
    } else if (columnSpec.type === 'string') {
        if (Object.prototype.hasOwnProperty.call(columnSpec, 'maxlength')) {
            column = table[columnSpec.type](columnName, columnSpec.maxlength);
        } else {
            column = table[columnSpec.type](columnName, 191);
        }
    } else {
        column = table[columnSpec.type](columnName);
    }

    if (Object.prototype.hasOwnProperty.call(columnSpec, 'nullable') && columnSpec.nullable === true) {
        column.nullable();
    } else {
        column.nullable(false);
    }
    if (Object.prototype.hasOwnProperty.call(columnSpec, 'primary') && columnSpec.primary === true) {
        column.primary();
    }
    if (Object.prototype.hasOwnProperty.call(columnSpec, 'unique') && columnSpec.unique) {
        column.unique();
    }
    if (Object.prototype.hasOwnProperty.call(columnSpec, 'unsigned') && columnSpec.unsigned) {
        column.unsigned();
    }
    if (Object.prototype.hasOwnProperty.call(columnSpec, 'references')) {
        // check if table exists?
        column.references(columnSpec.references);
    }
    if (Object.prototype.hasOwnProperty.call(columnSpec, 'cascadeDelete') && columnSpec.cascadeDelete === true) {
        column.onDelete('CASCADE');
    }
    if (Object.prototype.hasOwnProperty.call(columnSpec, 'defaultTo')) {
        column.defaultTo(columnSpec.defaultTo);
    }
    if (Object.prototype.hasOwnProperty.call(columnSpec, 'index') && columnSpec.index === true) {
        column.index();
    }
}

function addColumn(tableName, column, transaction, columnSpec) {
    return (transaction || db.knex).schema.table(tableName, function (table) {
        addTableColumn(tableName, table, column, columnSpec);
    });
}

function dropColumn(tableName, column, transaction) {
    return (transaction || db.knex).schema.table(tableName, function (table) {
        table.dropColumn(column);
    });
}

/**
 * Checks if unique index exists in a table over the given columns.
 *
 * @param {string} tableName - name of the table to add unique constraint to
 * @param {string|[string]} columns - column(s) to form unique constraint with
 * @param {Object} transaction - connection object containing knex reference
 * @param {Object} transaction.knex - knex instance
 */
async function hasUnique(tableName, columns, transaction) {
    const knex = (transaction || db.knex);
    const client = knex.client.config.client;
    const columnNames = _.isArray(columns) ? columns.join('_') : columns;
    const constraintName = `${tableName}_${columnNames}_unique`;

    if (client === 'mysql') {
        const dbName = knex.client.config.connection.database;
        const [rawConstraints] = await knex.raw(`
                SELECT CONSTRAINT_NAME
                FROM information_schema.TABLE_CONSTRAINTS
                WHERE 1=1
                AND CONSTRAINT_SCHEMA=:dbName
                AND TABLE_NAME=:tableName
                AND CONSTRAINT_TYPE='UNIQUE'`, {dbName, tableName});
        const dbConstraints = rawConstraints.map(c => c.CONSTRAINT_NAME);

        if (dbConstraints.includes(constraintName)) {
            return true;
        }
    } else {
        const rawConstraints = await knex.raw(`PRAGMA index_list('${tableName}');`);
        const dbConstraints = rawConstraints.map(c => c.name);

        if (dbConstraints.includes(constraintName)) {
            return true;
        }
    }

    return false;
}

/**
 * Adds an unique index to a table over the given columns.
 *
 * @param {string} tableName - name of the table to add unique constraint to
 * @param {string|[string]} columns - column(s) to form unique constraint with
 * @param {Object} transaction - connection object containing knex reference
 * @param {Object} transaction.knex - knex instance
 */
async function addUnique(tableName, columns, transaction) {
    const hasUniqueConstraint = await hasUnique(tableName, columns, transaction);

    if (!hasUniqueConstraint) {
        logging.info(`Adding unique constraint for: ${columns} in table ${tableName}`);
        return (transaction || db.knex).schema.table(tableName, function (table) {
            table.unique(columns);
        });
    } else {
        logging.warn(`Constraint for: ${columns} already exists for table: ${tableName}`);
    }
}

/**
 * Drops a unique key constraint from a table.
 *
 * @param {string} tableName - name of the table to drop unique constraint from
 * @param {string|[string]} columns - column(s) unique constraint was formed
 * @param {Object} transaction - connection object containing knex reference
 * @param {Object} transaction.knex - knex instance
 */
async function dropUnique(tableName, columns, transaction) {
    const hasUniqueConstraint = await hasUnique(tableName, columns, transaction);

    if (hasUniqueConstraint) {
        logging.info(`Dropping unique constraint for: ${columns} in table: ${tableName}`);
        return (transaction || db.knex).schema.table(tableName, function (table) {
            table.dropUnique(columns);
        });
    } else {
        logging.warn(`Constraint for: ${columns} does not exist for table: ${tableName}`);
    }
}

/**
 * Checks if a foreign key exists in a table over the given columns.
 *
 * @param {Object} configuration - contains all configuration for this function
 * @param {string} configuration.fromTableName - name of the table to add the foreign key to
 * @param {string} configuration.fromColumn - column of the table to add the foreign key to
 * @param {string} configuration.toTableName - name of the table to point the foreign key to
 * @param {string} configuration.toColumn - column of the table to point the foreign key to
 * @param {Object} configuration.transaction - connection object containing knex reference
 * @param {Object} configuration.transaction.knex - knex instance
 */
async function hasForeign({fromTable, fromColumn, toTable, toColumn, transaction}) {
    const knex = (transaction || db.knex);
    const client = knex.client.config.client;

    if (client === 'mysql') {
        const dbName = knex.client.config.connection.database;
        const [rawConstraints] = await knex.raw(`
            SELECT i.TABLE_NAME, k.COLUMN_NAME, k.REFERENCED_TABLE_NAME, k.REFERENCED_COLUMN_NAME
            FROM information_schema.TABLE_CONSTRAINTS i
            INNER JOIN information_schema.KEY_COLUMN_USAGE k ON i.CONSTRAINT_NAME = k.CONSTRAINT_NAME
            WHERE i.CONSTRAINT_TYPE = 'FOREIGN KEY'
            AND i.CONSTRAINT_SCHEMA=:dbName
            AND i.TABLE_NAME = :fromTable
            AND k.COLUMN_NAME = :fromColumn
            AND k.REFERENCED_TABLE_NAME = :toTable
            AND k.REFERENCED_COLUMN_NAME = :toColumn`, {dbName, fromTable, fromColumn, toTable, toColumn});

        return rawConstraints.length >= 1;
    } else {
        const foreignKeys = await knex.raw(`PRAGMA foreign_key_list('${fromTable}');`);

        const hasForeignKey = foreignKeys.some(foreignKey => foreignKey.table === toTable && foreignKey.from === fromColumn && foreignKey.to === toColumn);

        return hasForeignKey;
    }
}

/**
 * Adds a foreign key to a table.
 *
 * @param {Object} configuration - contains all configuration for this function
 * @param {string} configuration.fromTableName - name of the table to add the foreign key to
 * @param {string} configuration.fromColumn - column of the table to add the foreign key to
 * @param {string} configuration.toTableName - name of the table to point the foreign key to
 * @param {string} configuration.toColumn - column of the table to point the foreign key to
 * @param {Boolean} configuration.cascadeDelete - adds the "on delete cascade" option if true
 * @param {Object} configuration.transaction - connection object containing knex reference
 * @param {Object} configuration.transaction.knex - knex instance
 */
async function addForeign({fromTable, fromColumn, toTable, toColumn, cascadeDelete = false, transaction}) {
    const hasForeignKey = await hasForeign({fromTable, fromColumn, toTable, toColumn, transaction});

    if (!hasForeignKey) {
        logging.info(`Adding foreign key from ${fromTable}.${fromColumn} to ${toTable}.${toColumn}`);

        //disable and re-enable foreign key checks on sqlite because of https://github.com/knex/knex/issues/4155
        let foreignKeysEnabled;
        if (db.knex.client.config.client === 'sqlite3') {
            foreignKeysEnabled = await db.knex.raw('PRAGMA foreign_keys;');
            if (foreignKeysEnabled[0].foreign_keys) {
                await db.knex.raw('PRAGMA foreign_keys = OFF;');
            }
        }

        await (transaction || db.knex).schema.table(fromTable, function (table) {
            if (cascadeDelete) {
                table.foreign(fromColumn).references(`${toTable}.${toColumn}`).onDelete('CASCADE');
            } else {
                table.foreign(fromColumn).references(`${toTable}.${toColumn}`);
            }
        });

        if (db.knex.client.config.client === 'sqlite3') {
            if (foreignKeysEnabled[0].foreign_keys) {
                await db.knex.raw('PRAGMA foreign_keys = ON;');
            }
        }
    } else {
        logging.warn(`Skipped adding foreign key from ${fromTable}.${fromColumn} to ${toTable}.${toColumn} - foreign key already exists`);
    }
}

/**
 * Drops a foreign key from a table.
 *
 * @param {Object} configuration - contains all configuration for this function
 * @param {string} configuration.fromTableName - name of the table to add the foreign key to
 * @param {string} configuration.fromColumn - column of the table to add the foreign key to
 * @param {string} configuration.toTableName - name of the table to point the foreign key to
 * @param {string} configuration.toColumn - column of the table to point the foreign key to
 * @param {Object} configuration.transaction - connection object containing knex reference
 * @param {Object} configuration.transaction.knex - knex instance
 */
async function dropForeign({fromTable, fromColumn, toTable, toColumn, transaction}) {
    const hasForeignKey = await hasForeign({fromTable, fromColumn, toTable, toColumn, transaction});

    if (hasForeignKey) {
        logging.info(`Dropping foreign key from ${fromTable}.${fromColumn} to ${toTable}.${toColumn}`);

        //disable and re-enable foreign key checks on sqlite because of https://github.com/knex/knex/issues/4155
        let foreignKeysEnabled;
        if (db.knex.client.config.client === 'sqlite3') {
            foreignKeysEnabled = await db.knex.raw('PRAGMA foreign_keys;');
            if (foreignKeysEnabled[0].foreign_keys) {
                await db.knex.raw('PRAGMA foreign_keys = OFF;');
            }
        }

        await (transaction || db.knex).schema.table(fromTable, function (table) {
            table.dropForeign(fromColumn);
        });

        if (db.knex.client.config.client === 'sqlite3') {
            if (foreignKeysEnabled[0].foreign_keys) {
                await db.knex.raw('PRAGMA foreign_keys = ON;');
            }
        }
    } else {
        logging.warn(`Skipped dropping foreign key from ${fromTable}.${fromColumn} to ${toTable}.${toColumn} - foreign key does not exist`);
    }
}

/**
 * Checks if primary key index exists in a table over the given columns.
 *
 * @param {string} tableName - name of the table to add primary key constraint to
 * @param {Object} transaction - connnection object containing knex reference
 * @param {Object} transaction.knex - knex instance
 */
async function hasPrimaryKey(tableName, transaction) {
    const knex = (transaction || db.knex);
    const client = knex.client.config.client;

    if (client === 'mysql') {
        const dbName = knex.client.config.connection.database;
        const [rawConstraints] = await knex.raw(`
                SELECT CONSTRAINT_NAME
                FROM information_schema.TABLE_CONSTRAINTS
                WHERE 1=1
                AND CONSTRAINT_SCHEMA=:dbName
                AND TABLE_NAME=:tableName
                AND CONSTRAINT_TYPE='PRIMARY KEY'`, {dbName, tableName});

        return rawConstraints.length > 0;
    } else {
        const rawConstraints = await knex.raw(`PRAGMA index_list('${tableName}');`);
        const tablePrimaryKey = rawConstraints.find(c => c.origin === 'pk');

        return tablePrimaryKey;
    }
}

/**
 * Adds an primary key index to a table over the given columns.
 *
 * @param {string} tableName - name of the table to add primaykey  constraint to
 * @param {string|[string]} columns - column(s) to form primary key constraint with
 * @param {Object} transaction - connnection object containing knex reference
 * @param {Object} transaction.knex - knex instance
 */
async function addPrimaryKey(tableName, columns, transaction) {
    const hasUniqueConstraint = await hasPrimaryKey(tableName, transaction);

    if (!hasUniqueConstraint) {
        logging.info(`Adding primary key constraint for: ${columns} in table ${tableName}`);
        return (transaction || db.knex).schema.table(tableName, function (table) {
            table.primary(columns);
        });
    } else {
        logging.warn(`Primary key constraint for: ${columns} already exists for table: ${tableName}`);
    }
}

/**
 * https://github.com/tgriesser/knex/issues/1303
 * createTableIfNotExists can throw error if indexes are already in place
 */
function createTable(table, transaction, tableSpec = schema[table]) {
    return (transaction || db.knex).schema.hasTable(table)
        .then(function (exists) {
            if (exists) {
                return;
            }

            return (transaction || db.knex).schema.createTable(table, function (t) {
                Object.keys(tableSpec)
                    .filter(column => !(column.startsWith('@@')))
                    .forEach(column => addTableColumn(table, t, column, tableSpec[column]));

                if (tableSpec['@@INDEXES@@']) {
                    tableSpec['@@INDEXES@@'].forEach(index => t.index(index));
                }
                if (tableSpec['@@UNIQUE_CONSTRAINTS@@']) {
                    tableSpec['@@UNIQUE_CONSTRAINTS@@'].forEach(unique => t.unique(unique));
                }
            });
        });
}

function deleteTable(table, transaction) {
    return (transaction || db.knex).schema.dropTableIfExists(table);
}

function getTables(transaction) {
    const client = (transaction || db.knex).client.config.client;

    if (_.includes(_.keys(clients), client)) {
        return clients[client].getTables(transaction);
    }

    return Promise.reject(i18n.t('notices.data.utils.index.noSupportForDatabase', {client: client}));
}

function getIndexes(table, transaction) {
    const client = (transaction || db.knex).client.config.client;

    if (_.includes(_.keys(clients), client)) {
        return clients[client].getIndexes(table, transaction);
    }

    return Promise.reject(i18n.t('notices.data.utils.index.noSupportForDatabase', {client: client}));
}

function getColumns(table, transaction) {
    const client = (transaction || db.knex).client.config.client;

    if (_.includes(_.keys(clients), client)) {
        return clients[client].getColumns(table);
    }

    return Promise.reject(i18n.t('notices.data.utils.index.noSupportForDatabase', {client: client}));
}

function checkTables(transaction) {
    const client = (transaction || db.knex).client.config.client;

    if (client === 'mysql') {
        return clients[client].checkPostTable();
    }
}

function createColumnMigration(...migrations) {
    async function runColumnMigration(conn, migration) {
        const {
            table,
            column,
            dbIsInCorrectState,
            operation,
            operationVerb,
            columnDefinition
        } = migration;

        const hasColumn = await conn.schema.hasColumn(table, column);
        const isInCorrectState = dbIsInCorrectState(hasColumn);

        if (isInCorrectState) {
            logging.warn(`${operationVerb} ${table}.${column} column - skipping as table is correct`);
        } else {
            logging.info(`${operationVerb} ${table}.${column} column`);
            await operation(table, column, conn, columnDefinition);
        }
    }

    return async function columnMigration(conn) {
        for (const migration of migrations) {
            await runColumnMigration(conn, migration);
        }
    };
}

module.exports = {
    checkTables: checkTables,
    createTable: createTable,
    deleteTable: deleteTable,
    getTables: getTables,
    getIndexes: getIndexes,
    addUnique: addUnique,
    dropUnique: dropUnique,
    addPrimaryKey: addPrimaryKey,
    addForeign: addForeign,
    dropForeign: dropForeign,
    addColumn: addColumn,
    dropColumn: dropColumn,
    getColumns: getColumns,
    createColumnMigration
};
