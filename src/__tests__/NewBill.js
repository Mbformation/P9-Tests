/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import mockStore from "../__mocks__/store.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import router from "../app/Router.js";
import { ROUTES_PATH } from "../constants/routes.js";

jest.mock("../app/store", () => mockStore);

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    // ******   --------    BUG HUNT 1 - NewBill   --------   ******
    test("Unit Test: handleChangeFile() should add the correct file as a new bill", async () => {
      //arrange
      const html = NewBillUI();
      document.body.innerHTML = html;
      const store = mockStore;
      const mockPreventDefault = jest.fn(() => {
        return;
      });
      const file = "file.jPg";
      const email = "fake@gmail.com";
      const event = {
        target: {
          value: `home\\${file}`,
        },
        preventDefault: mockPreventDefault,
      };
      localStorageMock.setItem("user", { email });
      // on instancie un nouveau NewBill
      const newBill = new NewBill({
        document,
        store,
        localStorage: localStorageMock,
      });
      // act
      await newBill.handleChangeFile(event);
      // assert
      expect(mockPreventDefault).toHaveBeenCalled();
      expect(newBill.fileName).toEqual(file);
    });
    test("Unit Test: handleChangeFile() does not add the wrong file as a new bill", async () => {
      //arrange
      const html = NewBillUI();
      document.body.innerHTML = html;
      const store = mockStore;
      const mockPreventDefault = jest.fn(() => {
        return;
      });
      const file = "file.exe";
      const email = "fake@gmail.com";
      const event = {
        target: {
          value: `home\\${file}`,
        },
        preventDefault: mockPreventDefault,
      };
      localStorageMock.setItem("user", { email });
      const newBill = new NewBill({
        document,
        store,
        localStorage: localStorageMock,
      });
      // act
      await newBill.handleChangeFile(event);
      // assert
      expect(mockPreventDefault).toHaveBeenCalled();
      expect(newBill.fileName).toBe(null);
    });
    test("Then the correct files should have been submitted", async () => {
      //arrange
      const mockPreventDefault = jest.fn(() => {
        return;
      });
      const mockOnNavigate = jest.fn(() => {
        return;
      });
      const mockQuerySelector = jest.fn((data) => {
        return { value: "1" };
      });
      const store = mockStore;
      const html = NewBillUI();
      document.body.innerHTML = html;
      const email = "fake@gmail.com";
      localStorageMock.setItem("user", { email });
      const event = {
        target: {
          querySelector: mockQuerySelector,
        },
        preventDefault: mockPreventDefault,
      };
      const newBill = new NewBill({
        document,
        store,
        onNavigate: mockOnNavigate,
        localStorage: localStorageMock,
      });

      // act
      newBill.handleSubmit(event);

      // assert
      expect(mockPreventDefault).toHaveBeenCalled();
      expect(mockQuerySelector).toHaveBeenCalledTimes(8);
      expect(mockOnNavigate).toHaveBeenCalled();
    });
  });
});

test("creates new bill from mock API POST", async () => {
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
  window.onNavigate(ROUTES_PATH.NewBill);
  const submitBtn = document.getElementById("btn-send-bill");
  submitBtn.click();

  //assert

  await waitFor(() => screen.getByText("Mes notes de frais"));
  const contentPage = await screen.getByText("Mes notes de frais"); //1
  expect(contentPage).toBeTruthy();
});

