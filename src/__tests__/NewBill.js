import { fireEvent, screen, waitFor } from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import { ROUTES_PATH, ROUTES } from "../constants/routes";
import { localStorageMock } from "../__mocks__/localStorage.js";
import Router from "../app/Router.js";
import {
  getByTestId, getAllByText
} from '@testing-library/dom'
import { rest } from 'msw'
import { setupServer } from 'msw/node'
import Store from "../app/Store"
import 'whatwg-fetch'
import store from "../__mocks__/store"
import BillsUI from "../views/BillsUI.js"

const server = setupServer(
  rest.post('http://localhost:5678/bills', (req, res, ctx) => {
    return res(
      ctx.json({
        key: "4TnUYWpEaEvJni9piBnWdV",
        id: 17,
        email: "employee@test.tld",
        fileName: "IMG_20210404_172328.jpg",
        filePath: "public\\e4ed1af1ad51be00eb95497c3ded2ca7",
        updatedAt: "2022-01-09T12:31:28.160Z",
        createdAt: "2022-01-09T12:31:28.160Z"
      })
    )
  })
)

// Active la simulation d'API avant les tests depuis server
beforeAll(() => server.listen())
// Réinitialise tout ce qu'on aurait pu ajouter en termes de durée pour nos tests avant chaque test
afterEach(() => server.resetHandlers())
// Ferme la simulation d'API une fois que les tests sont finis
afterAll(() => server.close())

describe("Given I am connected as an employee", () => {
  Object.defineProperty(window, "localStorage", {
    value: localStorageMock,
  });
  window.localStorage.setItem(
    "user",
    JSON.stringify({
      type: "Employee",
      email: "mbweb47@gmail.com",
      jwt: "gfgfdfgdfgdfg"
    })
  );

  const onNavigate = (pathname) => {
    document.body.innerHTML = ROUTES({ pathname });
  };

  describe("When I am on NewBill Page", () => {
    Object.defineProperty(window, "location", {
      value: { hash: ROUTES_PATH["NewBill"] },
    });
    document.body.innerHTML = `<div id="root"></div>`;
    test("Then New bill icon in vertical layout should be highlighted", () => {
      Router();
      const billIcon = getByTestId(document.body, "icon-mail")
      expect(billIcon).toBeTruthy();
      expect(billIcon.classList.contains("active-icon")).toBeTruthy();
    })

    describe("When i click on submit btn", () => {
      test("Then the handleSubmit function should be called and i am redirected to Bills page (view BillUI)", () => {
        const html = NewBillUI();
        document.body.innerHTML = html;
        const newBill = new NewBill({
          document,
          onNavigate,
          firestore: null,
          localStorage: window.localStorage,
        });

        const form = document.querySelector(`form[data-testid="form-new-bill"]`);
        const handleSubmit = jest.fn(newBill.handleSubmit);
        form.addEventListener("submit", handleSubmit);
        fireEvent.submit(form);
        expect(handleSubmit).toHaveBeenCalled();
        expect(getAllByText(document.body, "Mes notes de frais")).toBeTruthy();
      });
    })

    describe("When i add a file with a non valid extension", () => {
      test("Then the visual cue to indicate the wrong input should be displayed and the store.bills method should not be called", () => {
        const html = NewBillUI();
        document.body.innerHTML = html;

        const store = Store;

        const getSpy = jest.spyOn(store, "bills")

        const newBill = new NewBill({
          document,
          onNavigate,
          store: "",
          localStorage: window.localStorage,
        });

        const file = screen.getByTestId("file");
        const handleChangeFile = jest.fn(newBill.handleChangeFile);
        file.addEventListener("change", (e) => handleChangeFile(e));
        fireEvent.change(file, {
          target: {
            files: [new File(["image"], "image.gif", { type: "image/jpg" })],
          },
        });
        expect(file.classList.contains('is-invalid')).toBeTruthy();
        expect(handleChangeFile).toHaveBeenCalled();
        expect(getSpy).not.toHaveBeenCalled();
      })
    })

    describe("When i add a file with valid extension", () => {
      test("Then the visual cue to indicate the wrong input shouldn't be displayed and the store.bills method should be called", async () => {
        Object.defineProperty(window, "localStorage", {
          value: localStorageMock,
        });
        window.localStorage.setItem(
          "user",
          JSON.stringify({
            type: "Employee",
            email: "mbweb47@gmail.com",
            jwt: "gfgfdfgdfgdfg"
          })
        );

        const html = NewBillUI();
        document.body.innerHTML = html;
        const errorMsg = document.createElement('div');
        errorMsg.className = "err-msg";

        const store = Store;

        const getSpy = jest.spyOn(store, "bills")

        const newBill = new NewBill({
          document,
          onNavigate,
          store,
          localStorage: window.localStorage,
        });

        const file = screen.getByTestId("file");
        file.after(errorMsg)
        file.classList.add('is-invalid');
        const handleChangeFile = jest.fn(newBill.handleChangeFile);
        file.addEventListener("change", (e) => handleChangeFile(e));
        fireEvent.change(file, {
          target: {
            files: [new File(["image"], "image.jpg", { type: "image/jpg" })],
          },
        });
        expect(file.classList.contains('is-invalid')).toBeFalsy();
        expect(handleChangeFile).toHaveBeenCalled();
        expect(getSpy).toHaveBeenCalled();
      })
    })
  })

  describe("When I post a bill and it save on server", () => {
    test("Then the total of bills should be increased by 1", async () => {
      const postSpy = jest.spyOn(store, "post");
      const newBillForTest = {
        id: "GdkDKEIOZOoR",
        vat: "23",
        amount: 345,
        name: "test integration post",
        fileName: "billtest",
        commentary: "note de frais pour test",
        pct: 43,
        type: "Transport",
        email: "mbweb@gmail.com",
        fileUrl:
          "https://image-test.jpg",
        date: "2004-12-04",
        status: "pending",
        commentAdmin: "test comment",
      };
      const allBills = await store.post(newBillForTest);
      expect(postSpy).toHaveBeenCalledTimes(1);
      expect(allBills.data.length).toBe(5);
    });

    test("fetches bills from an API and fails with 404 message error", async () => {
      store.post.mockImplementationOnce(() =>
        Promise.reject(new Error("Erreur 404"))
      );
      const html = BillsUI({ error: "Erreur 404" });
      document.body.innerHTML = html;
      const message = await screen.getByText(/Erreur 404/);
      expect(message).toBeTruthy();
    });
    test("fetches messages from an API and fails with 500 message error", async () => {
      store.post.mockImplementationOnce(() =>
        Promise.reject(new Error("Erreur 500"))
      );
      const html = BillsUI({ error: "Erreur 500" });
      document.body.innerHTML = html;
      const message = await screen.getByText(/Erreur 500/);
      expect(message).toBeTruthy();
    });
  });
});