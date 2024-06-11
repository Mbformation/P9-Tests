/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store.js";

import router from "../app/Router.js";

// on test le bills container
import Bills from "../containers/Bills.js";

jest.mock("../app/store", () => mockStore);

describe("Given I am connected as an employee", () => {
  describe("Given there is a store with some bills", () => {
    test("Unit Test: getBills() returns all correctly formated bills ", async () => {
      // Arrange
      document.body.innerHTML = BillsUI({ data: bills });
      const myBills = new Bills({ document: document, store: mockStore }); // passer document
      const mockedData = await mockStore.bills().list();
      // Act
      const data = await myBills.getBills();
      // Assert
      expect(data).toHaveLength(mockedData.length);
      expect(data[0].id).toBe(mockedData[0].id);
      expect(data[0].vat).toBe(mockedData[0].vat);
      expect(data[0].fileUrl).toBe(mockedData[0].fileUrl);
      expect(data[0].status).toBe("En attente");
      expect(data[0].type).toBe(mockedData[0].type);
      expect(data[0].commentary).toBe(mockedData[0].commentary);
      expect(data[0].name).toBe(mockedData[0].name);
      expect(data[0].fileName).toBe(mockedData[0].fileName);
      expect(data[0].date).toBe("4 Avr. 04");
      expect(data[0].amount).toBe(mockedData[0].amount);
      expect(data[0].commentAdmin).toBe(mockedData[0].commentAdmin);
      expect(data[0].email).toBe(mockedData[0].email);
      expect(data[0].pct).toBe(mockedData[0].pct);
    });
  });
  describe("Given there is a corrupted store with some bills", () => {
    test("Unit Test: getBills() returns all correctly formated bills except date", async () => {
      //arrange
      document.body.innerHTML = BillsUI({ data: bills });
      const mockNavigate = jest.fn((path) => path);
      const corruptedStore = {
        bills: jest.fn(() => ({
          list: jest.fn(() =>
            Promise.resolve([
              {
                id: "47qAXb6fIm2zOKkLzMro",
                vat: "80",
                fileUrl:
                  "https://test.storage.tld/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=c1640e12-a24b-4b11-ae52-529112e9602a",
                status: "pending",
                type: "Hôtel et logement",
                commentary: "séminaire billed",
                name: "encore",
                fileName: "preview-facture-free-201801-pdf-1.jpg",
                date: "falseDate", // bad date
                amount: 400,
                commentAdmin: "ok",
                email: "a@a",
                pct: 20,
              },
            ])
          ),
        })),
      };

      const billsInstance = new Bills({
        document: document,
        store: corruptedStore,
        onNavigate: mockNavigate,
      });
      //act
      const result = await billsInstance.getBills();
      //assert
      expect(result).toHaveLength(1);
      expect(result[0].date).toBe("falseDate");
    });
  });
  test("Then data is returned", () => {});
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      //arrange
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();

      //act
      window.onNavigate(ROUTES_PATH.Bills);

      //assert
      await waitFor(() => screen.getByTestId("icon-window"));
      const windowIcon = screen.getByTestId("icon-window");

      // AJOUT EXPECT
      expect(windowIcon.className).toBe("active-icon");
    });
    test("Then bills should be ordered from earliest to latest", () => {
      //Arrange on prépare les données à tester
      const dateRegex =
        /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i;
      const antiChrono = (a, b) => (a < b ? 1 : -1);
      //Act
      document.body.innerHTML = BillsUI({ data: bills }); // on récupère les el html et on construit un tableau de dates
      // Assert
      const dates = screen.getAllByText(dateRegex).map((a) => a.innerHTML);
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });
  });

  describe("Given there is no store", () => {
    test("Unit test : handleClickNewBill, user successfully navigates to NewBill page", () => {
      // Arrange
      document.body.innerHTML = BillsUI({ data: bills });
      const mockNavigate = jest.fn((path) => path);
      const billsInstance = new Bills({
        document: document,
        onNavigate: mockNavigate,
      });
      // Act
      billsInstance.handleClickNewBill();
      // Assert
      expect(mockNavigate).toHaveBeenCalledWith(ROUTES_PATH["NewBill"]);
    });
    test("UI/UX Test: ", () => {
      //TODO: préciser objet du test
      // Arrange
      document.body.innerHTML = BillsUI({ data: bills });
      const mockNavigate = jest.fn((path) => path);
      const billsInstance = new Bills({
        document: document,
        onNavigate: mockNavigate,
      });
      const buttonNewBill = document.querySelector(
        `button[data-testid="btn-new-bill"]`
      );
      // Act
      buttonNewBill.click();
      // Assert
      expect(mockNavigate).toHaveBeenCalledWith(ROUTES_PATH["NewBill"]);
    });
  });
});

describe("Given I am a user connected as Employee", () => {
  describe("When I navigate to Bills", () => {
    test("fetches bills from mock API GET", async () => {
      //arrange
      localStorage.setItem(
        "user",
        JSON.stringify({ type: "Employee", email: "e@e" })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      //act
      window.onNavigate(ROUTES_PATH.Bills);

      //assert
      await waitFor(() => screen.getByText("Mes notes de frais"));
      const contentPending = await screen.getByText("pending"); //1
      expect(contentPending).toBeTruthy();
      const contentRefused = await screen.getAllByText("refused"); //2
      expect(contentRefused.length).toBe(2);
      const contentAccepted = await screen.getByText("accepted"); //1
      expect(contentAccepted).toBeTruthy();
      const contentHasItem = await screen.getAllByText("Transports");
      expect(contentHasItem.length).toBe(2);
    });
    describe("When an error occurs on API", () => {
      //Arrange commun pour les tests qui suivent
      beforeEach(() => {
        jest.spyOn(mockStore, "bills");
        Object.defineProperty(window, "localStorage", {
          value: localStorageMock,
        });
        window.localStorage.setItem(
          "user",
          JSON.stringify({
            type: "Employee",
            email: "e@e",
          })
        );
        const root = document.createElement("div");
        root.setAttribute("id", "root");
        document.body.appendChild(root);
        router();
      });
      test("fetches bills from an API and fails with 404 message error", async () => {
        //arrange

        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 404"));
            },
          };
        });
        //act
        window.onNavigate(ROUTES_PATH.Bills);
        //assert

        await new Promise(process.nextTick);
        const message = await screen.getByText(/Erreur 404/);
        expect(message).toBeTruthy();
      });

      test("fetches messages from an API and fails with 500 message error", async () => {
        //arrange
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 500"));
            },
          };
        });
        //act
        window.onNavigate(ROUTES_PATH.Bills);
        //assert
        await new Promise(process.nextTick);
        const message = await screen.getByText(/Erreur 500/);
        expect(message).toBeTruthy();
      });
    });
  });
});
