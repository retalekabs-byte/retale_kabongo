import UserBlock from '#models/user_block'

export default class Blocks {
  static async between(leftId: number, rightId: number) {
    const row = await UserBlock.query()
      .where((query) => {
        query
          .where((pair) => pair.where('blockerId', leftId).where('blockedId', rightId))
          .orWhere((pair) => pair.where('blockerId', rightId).where('blockedId', leftId))
      })
      .first()

    return Boolean(row)
  }

  static async mine(blockerId: number, blockedId: number) {
    return UserBlock.query().where('blockerId', blockerId).where('blockedId', blockedId).first()
  }

  static async relatedIds(userId: number) {
    const rows = await UserBlock.query()
      .where('blockerId', userId)
      .orWhere('blockedId', userId)
      .select('blockerId', 'blockedId')

    return rows.map((row) => (row.blockerId === userId ? row.blockedId : row.blockerId))
  }
}
