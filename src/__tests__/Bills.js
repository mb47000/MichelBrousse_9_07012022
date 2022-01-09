/**
 * @jest-environment jsdom
 */

import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import {
  getByTestId, getAllByText,screen
} from '@testing-library/dom'
import { localStorageMock } from "../__mocks__/localStorage.js";
import Router from "../app/Router.js";
import { ROUTES_PATH, ROUTES } from "../constants/routes";
import Bills from "../containers/Bills.js";
import userEvent from "@testing-library/user-event";
import store from "../__mocks__/store"

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

  const onNavigate = (pathname) => {
    document.body.innerHTML = ROUTES({ pathname });
  };

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

    describe("When page is loading", () => {
      test("Then I should land on a loading page", () => {
        Router();
        expect(getAllByText(document.body, "Loading...")).toBeTruthy();
      })
    })

    describe("But an error message has been thrown", () => {
      test("Then Error page should be rendrered", () => {
        const html = BillsUI({ error: "some error message" });
        document.body.innerHTML = html;
        expect(getAllByText(document.body, "some error message")).toBeTruthy();
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

    // Test Bills Container handleClickNewBill
    describe("When i click on NewBill button", () => {
      test("Then function handleClickNewBill is called and new Bill form should be displayed", () => {
        const bill = new Bills({
          document,
          onNavigate,
          store: null,
          bills,
          localStorage: window.localStorage,
        });
        const html = BillsUI({ data: bills });
        document.body.innerHTML = html;

        const handleClickNewBill = jest.fn((e) => bill.handleClickNewBill(e));
        const btn = getByTestId(document.body, "btn-new-bill");
        btn.addEventListener("click", handleClickNewBill);
        userEvent.click(btn);
        expect(handleClickNewBill).toHaveBeenCalled();
        userEvent.click(btn);
        const title = screen.getAllByText("Envoyer une note de frais");
        expect(title).toBeTruthy();
      });
    });

    // Test Bills Container handleClickIconEye
    describe("When i click on Icon Eye button", () => {
      test("Then function handleClickIconEye is called and the modal should be displayed", () => {
        const html = BillsUI({ data: bills });
        document.body.innerHTML = html;

        const bill = new Bills({
          document,
          onNavigate,
          store: null,
          bills,
          localStorage: window.localStorage,
        });

        let modalTarget = document.querySelector("#modaleFile");

        $.fn.modal = jest.fn(() => {
          modalTarget.classList.add("show");
        });

        const iconEye = screen.getAllByTestId("icon-eye")[0];
        const handleClickIconEye = jest.fn(() => {
          bill.handleClickIconEye(iconEye);
        });
        iconEye.addEventListener("click", handleClickIconEye);
        userEvent.click(iconEye);

        expect(handleClickIconEye).toBeCalled();

        expect(modalTarget.classList.contains("show")).toBeTruthy();
      });
    });
  })
})

// test d'intégration GET
describe("Given I am a user connected as employee", () => {
  describe("When I navigate to Dashboard", () => {
    test("fetches bills from mock API GET", async () => {
       const getSpy = jest.spyOn(store, "get")
       const bills = await store.get()
       expect(getSpy).toHaveBeenCalledTimes(1)
       expect(bills.data.length).toBe(4)
    })
    test("fetches bills from an API and fails with 404 message error", async () => {
      store.get.mockImplementationOnce(() =>
        Promise.reject(new Error("Erreur 404"))
      )
      const html = BillsUI({ error: "Erreur 404" })
      document.body.innerHTML = html
      const message = await screen.getByText(/Erreur 404/)
      expect(message).toBeTruthy()
    })
    test("fetches messages from an API and fails with 500 message error", async () => {
      store.get.mockImplementationOnce(() =>
        Promise.reject(new Error("Erreur 500"))
      )
      const html = BillsUI({ error: "Erreur 500" })
      document.body.innerHTML = html
      const message = await screen.getByText(/Erreur 500/)
      expect(message).toBeTruthy()
    })
  })
})