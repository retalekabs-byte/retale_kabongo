import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'home': { paramsTuple?: []; params?: {} }
    'email_verification': { paramsTuple?: []; params?: {} }
    'email_verification.resend': { paramsTuple?: []; params?: {} }
    'email_verification.confirm': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'password.reset': { paramsTuple?: []; params?: {} }
    'password.reset.store': { paramsTuple?: []; params?: {} }
    'password.reset.edit': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'password.reset.update': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'new_account.create': { paramsTuple?: []; params?: {} }
    'new_account.store': { paramsTuple?: []; params?: {} }
    'session.create': { paramsTuple?: []; params?: {} }
    'session.store': { paramsTuple?: []; params?: {} }
    'chat': { paramsTuple?: []; params?: {} }
    'conversations.create': { paramsTuple?: []; params?: {} }
    'conversations.store': { paramsTuple?: []; params?: {} }
    'chat.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'profile': { paramsTuple?: []; params?: {} }
    'profile.update': { paramsTuple?: []; params?: {} }
    'dashboard': { paramsTuple?: []; params?: {} }
    'session.destroy': { paramsTuple?: []; params?: {} }
  }
  GET: {
    'home': { paramsTuple?: []; params?: {} }
    'email_verification': { paramsTuple?: []; params?: {} }
    'email_verification.confirm': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'password.reset': { paramsTuple?: []; params?: {} }
    'password.reset.edit': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'new_account.create': { paramsTuple?: []; params?: {} }
    'session.create': { paramsTuple?: []; params?: {} }
    'chat': { paramsTuple?: []; params?: {} }
    'conversations.create': { paramsTuple?: []; params?: {} }
    'chat.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'profile': { paramsTuple?: []; params?: {} }
    'dashboard': { paramsTuple?: []; params?: {} }
  }
  HEAD: {
    'home': { paramsTuple?: []; params?: {} }
    'email_verification': { paramsTuple?: []; params?: {} }
    'email_verification.confirm': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'password.reset': { paramsTuple?: []; params?: {} }
    'password.reset.edit': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'new_account.create': { paramsTuple?: []; params?: {} }
    'session.create': { paramsTuple?: []; params?: {} }
    'chat': { paramsTuple?: []; params?: {} }
    'conversations.create': { paramsTuple?: []; params?: {} }
    'chat.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'profile': { paramsTuple?: []; params?: {} }
    'dashboard': { paramsTuple?: []; params?: {} }
  }
  POST: {
    'email_verification.resend': { paramsTuple?: []; params?: {} }
    'password.reset.store': { paramsTuple?: []; params?: {} }
    'password.reset.update': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'new_account.store': { paramsTuple?: []; params?: {} }
    'session.store': { paramsTuple?: []; params?: {} }
    'conversations.store': { paramsTuple?: []; params?: {} }
    'profile.update': { paramsTuple?: []; params?: {} }
    'session.destroy': { paramsTuple?: []; params?: {} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}