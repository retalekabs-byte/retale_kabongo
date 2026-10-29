import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'user_blocks'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.integer('blocker_id').unsigned().notNullable().references('id').inTable('users')
      table.integer('blocked_id').unsigned().notNullable().references('id').inTable('users')

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.unique(['blocker_id', 'blocked_id'])
      table.check('blocker_id <> blocked_id', [], 'user_blocks_not_self_check')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
