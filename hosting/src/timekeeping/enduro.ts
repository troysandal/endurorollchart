import RouteSheet from "./routesheet";

/**
 * Wrapper for an enduro race that holds pertinent fields and an optional
 * route sheet.  This allows people to schedule races without knowing the
 * route sheet ahead of time.
 */
export class Enduro {
  title:string = ''
  routeSheet: RouteSheet = new RouteSheet()

  constructor(routeSheet?:RouteSheet) {
    this.routeSheet = routeSheet || new RouteSheet()
  }
}

export default Enduro
