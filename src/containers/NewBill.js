import { ROUTES_PATH } from '../constants/routes.js'
import Logout from "./Logout.js"

export default class NewBill {
  constructor({ document, onNavigate, store, localStorage }) {
    this.document = document
    this.onNavigate = onNavigate
    this.store = store
    const formNewBill = this.document.querySelector(`form[data-testid="form-new-bill"]`)
    formNewBill.addEventListener("submit", this.handleSubmit)
    const file = this.document.querySelector(`input[data-testid="file"]`)
    file.addEventListener("change", this.handleChangeFile)
    this.fileUrl = null
    this.fileName = null
    this.billId = null
    new Logout({ document, localStorage, onNavigate })
  }
  handleChangeFile = e => {
    e.preventDefault()
    const file = this.document.querySelector(`input[data-testid="file"]`).files[0]
    const filePath = e.target.value.split(/\\/g)
    const fileName = filePath[filePath.length - 1]
    const formData = new FormData()
    const email = JSON.parse(localStorage.getItem("user")).email

    console.log(email)
    // add extension verification 1/2
    const extensions = ["jpg", "jpeg", "png", "JPG", "JPEG", "PNG"];
    const currentExtension = file.name.split(".").pop();

    // add error message if extension verification fails 1/3
    const errorMsg = document.createElement('div');
    errorMsg.className = "err-msg";
    errorMsg.style.color = 'red';
    errorMsg.innerHTML = "Mauvais format, uniquement jpg, jpeg ou png."

    const targetInput = this.document.querySelector(`input[data-testid="file"]`);

    // add extension verification 2/2
    if (extensions.includes(currentExtension)) {

      // add error message if extension verification fails 2/3
      if (targetInput.classList.contains("is-invalid")) {
        targetInput.classList.add("blue-border");
        targetInput.classList.remove("is-invalid")
        document.querySelector(".err-msg").remove();
      }

      formData.append('file', file)
      formData.append('email', email)

      this.store
        .bills()
        .create({
          data: formData,
          headers: {
            noContentType: true
          }
        })
        .then(({ fileUrl, key }) => {
          this.billId = key
          this.fileUrl = fileUrl
          this.fileName = fileName
        }).catch(error => console.error(error))
    } else {
      // add error message if extension verification fails 3/3
     targetInput.classList.add('is-invalid');
     targetInput.classList.remove("blue-border");
     targetInput.value = ""

      if (!document.querySelector(".err-msg")) {
       targetInput.after(errorMsg)
      }
    }
  }


  handleSubmit = e => {
    e.preventDefault()
    console.log('e.target.querySelector(`input[data-testid="datepicker"]`).value', e.target.querySelector(`input[data-testid="datepicker"]`).value)
    const email = JSON.parse(localStorage.getItem("user")).email
    const bill = {
      email,
      type: e.target.querySelector(`select[data-testid="expense-type"]`).value,
      name: e.target.querySelector(`input[data-testid="expense-name"]`).value,
      amount: parseInt(e.target.querySelector(`input[data-testid="amount"]`).value),
      date: e.target.querySelector(`input[data-testid="datepicker"]`).value,
      vat: e.target.querySelector(`input[data-testid="vat"]`).value,
      pct: parseInt(e.target.querySelector(`input[data-testid="pct"]`).value) || 20,
      commentary: e.target.querySelector(`textarea[data-testid="commentary"]`).value,
      fileUrl: this.fileUrl,
      fileName: this.fileName,
      status: 'pending'
    }
    this.updateBill(bill)
    this.onNavigate(ROUTES_PATH['Bills'])
  }

  // not need to cover this function by tests
  /* istanbul ignore next */
  updateBill = (bill) => {
    if (this.store) {
      this.store
        .bills()
        .update({ data: JSON.stringify(bill), selector: this.billId })
        .then(() => {
          this.onNavigate(ROUTES_PATH['Bills'])
        })
        .catch(error => console.error(error))
    }
  }
}