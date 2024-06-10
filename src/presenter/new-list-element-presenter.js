import { RenderPosition, remove, render } from '../framework/render.js';
import EditFormView from '../view/edit-form-view.js';
import { StatusOfForm, UpdateType, UserAction } from '../const.js';

export default class NewListElementPresenter {
  #listContainer = null;
  #handleDataChange = null;
  #handleDestroy = null;

  #listElementEditComponent = null;

  constructor ({listContainer, onDataChange, onDestroy}) {
    this.#listContainer = listContainer;
    this.#handleDataChange = onDataChange;
    this.#handleDestroy = onDestroy;
  }

  init() {
    if (this.#listElementEditComponent !== null) {
      return;
    }

    this.#listElementEditComponent = new EditFormView({
      onFormSubmit: this.#handleFormSubmit,
      onCancelEditForm: this.#handleCancelEditForm,
      onDeleteClick: this.#handleCancelEditForm,
      onOutsideClick: this.#handleCancelEditForm,
      isAddOrEdit: StatusOfForm.ADD
    });

    render(this.#listElementEditComponent, this.#listContainer, RenderPosition.AFTERBEGIN);
    document.addEventListener('keydown', this.#escKeyDownHandler);
  }

  destroy() {
    if (this.#listElementEditComponent === null) {
      return;
    }

    this.#handleDestroy();
  }

  setSaving() {
    this.#listElementEditComponent.updateElement({
      isDisabled: true,
      isSaving: true,
    });
  }

  #escKeyDownHandler = (evt) => {
    if (evt.key === 'Escape' || evt.key === 'Esc') {
      evt.preventDefault();
      remove(this.#listElementEditComponent);
      this.destroy();
    }
  };

  #handleFormSubmit = (listElement) => {
    this.#handleDataChange(
      UserAction.ADD_LIST_ELEMENT,
      UpdateType.MINOR,
      listElement
    );
    remove(this.#listElementEditComponent);

    this.#listElementEditComponent = null;
  };

  #handleCancelEditForm = () => {
    remove(this.#listElementEditComponent);
    this.destroy();

    this.#listElementEditComponent = null;
  };
}
