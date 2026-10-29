import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('full_name', 255).notNullable().alter()
      table.string('avatar', 255).nullable()
      table.timestamp('email_verified_at').nullable()
      table.timestamp('last_seen_at').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('full_name').nullable().alter()
      table.dropColumns('avatar', 'email_verified_at', 'last_seen_at')
    })
  }
}
