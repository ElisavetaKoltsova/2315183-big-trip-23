import ListView from '../view/list-view.js';
import { remove, render } from '../framework/render.js';
import NoListElementView from '../view/no-list-element-view.js';
import SortView from '../view/sort-view.js';
import ListElementPresenter from './list-element-presenter.js';
import { SortType, UserAction, UpdateType } from '../const.js';
import { sortListByDate, sortListByPrice, sortListByTime } from '../view/utils/list.js';
import { filter } from '../view/utils/filter.js';

export default class ListPresenter {
  #listContainer = null;
  #waypointsModel = null;
  #filterModel = null;

  #listComponent = new ListView();
  #noListElementsComponent = new NoListElementView();
  #sortComponent = null;

  #listElementPresenters = new Map();

  #currentSortType = SortType.DAY;

  constructor({listContainer, waypointsModel, filterModel}) {
    this.#listContainer = listContainer;
    this.#waypointsModel = waypointsModel;
    this.#filterModel = filterModel;

    this.#waypointsModel.addObserver(this.#handleModelEvent);
    this.#filterModel.addObserver(this.#handleModelEvent);
  }

  get waypoints() {
    const filterType = this.#filterModel.filter;
    const waypoints = this.#waypointsModel.waypoints;
    const filteredWaypoints = filter[filterType](waypoints);

    switch (this.#currentSortType) {
      case SortType.PRICE:
        return filteredWaypoints.sort(sortListByPrice);
      case SortType.TIME:
        return filteredWaypoints.sort(sortListByTime);
    }

    return filteredWaypoints;
  }

  init() {
    this.waypoints.sort(sortListByDate);

    this.#renderList();
  }

  #handleViewAction = (actionType, updateType, update) => {
    switch (actionType) {
      case UserAction.UPDATE_LIST_ELEMENT:
        this.#waypointsModel.updateListElement(updateType, update);
        break;
      case UserAction.ADD_LIST_ELEMENT:
        this.#waypointsModel.addListElement(updateType, update);
        break;
      case UserAction.DELETE_LIST_ELEMENT:
        this.#waypointsModel.deleteListElement(updateType, update);
        break;
    }
  };

  #handleModelEvent = (updateType, data) => {
    switch (updateType) {
      case UpdateType.PATCH:
        this.#listElementPresenters.get(data.id).init(data);
        break;
      case UpdateType.MINOR:
        this.#clearList();
        this.#renderList();
        break;
      case UpdateType.MAJOR:
        this.#clearList({resetSortType: true});
        this.#renderList();
        break;
    }
  };

  #handleModelChange = () => {
    this.#listElementPresenters.forEach((presenter) => presenter.resetView());
  };

  #handleSortTypeChange = (sortType) => {
    if(this.#currentSortType === sortType) {
      return;
    }

    this.#currentSortType = sortType;

    this.#clearList();
    this.#renderList();
  };

  #renderList() {
    render(this.#listComponent, this.#listContainer);

    const waypoints = this.waypoints;
    const waypointsCount = waypoints.length;

    if (waypointsCount === 0) {
      this.#renderNoListElements(this.#noListElementsComponent, this.#listComponent);
      return;
    }

    this.#renderSort(this.#listContainer);

    this.waypoints.forEach((waypoint) => {
      this.#renderListElement(waypoint);
    });
  }

  #renderListElement(listElement) {
    const listElementPresenter = new ListElementPresenter({
      listContainer: this.#listComponent.element,
      onDataChange: this.#handleViewAction,
      onModeChange: this.#handleModelChange
    });

    listElementPresenter.init(listElement);
    this.#listElementPresenters.set(listElement.id, listElementPresenter);
  }

  #renderSort(listContainer) {
    this.#sortComponent = new SortView({
      onSortTypeChange: this.#handleSortTypeChange,
      currentSort: this.#currentSortType
    });

    render(this.#sortComponent, listContainer, 'afterbegin');
  }

  #renderNoListElements(noListElementsComponent, listComponent) {
    render(noListElementsComponent, listComponent.element);
  }

  #clearList({resetSortType = false} = {}) {
    this.#listElementPresenters.forEach((presenter) => presenter.destroy());
    this.#listElementPresenters.clear();

    remove(this.#sortComponent);
    remove(this.#noListElementsComponent);

    if(resetSortType) {
      this.#currentSortType = SortType.DAY;
    }
  }
}
