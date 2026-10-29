import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'conversations'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.string('type', 20).notNullable()
      table.string('name', 255).nullable()
      table.text('avatar').nullable()
      table.integer('created_by').unsigned().notNullable().references('id').inTable('users')

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.check(`type in ('private', 'group')`, [], 'conversations_type_check')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
