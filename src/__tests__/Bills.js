/**
 * @jest-environment jsdom
 */

import { screen } from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import {
  getByTestId, getAllByText
} from '@testing-library/dom'
import { localStorageMock } from "../__mocks__/localStorage.js";
import Router from "../app/Router.js";
import { ROUTES_PATH } from "../constants/routes";

describe("Given I am connected as an employee", () => {
  Object.defineProperty(window, "localStorage", {
    value: localStorageMock,
  });
  window.localStorage.setItem(
    "user",
    JSON.stringify({
      type: "Employee",
    })
  );

  describe("When I am on Bills Page", () => {
    Object.defineProperty(window, "location", {
      value: { hash: ROUTES_PATH["Bills"] },
    });
    document.body.innerHTML = `<div id="root"></div>`;
    
    test("Then bill icon in vertical layout should be highlighted", () => {
      Router();
      const billIcon = getByTestId(document.body, "icon-window")
      expect(billIcon).toBeTruthy();
      expect(billIcon.classList.contains("active-icon")).toBeTruthy();
    })

    describe("But it is loading ", () => {
      test("Then I should land on a loading page", () => {
        Router();
        expect(getAllByText(document.body, "Loading...")).toBeTruthy();
      })
    })
    
    describe("But an error message has been thrown", () => {
      test("Then Error page should be rendrered", () => {
        const html = BillsUI({ error: "some error message" });
        document.body.innerHTML = html;
        expect(getAllByText(document.body,"some error message")).toBeTruthy();
      })
    })

    test("Then bills should be ordered from earliest to latest", () => {
      const html = BillsUI({ data: bills })
      document.body.innerHTML = html
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
  })
})