/**
 * Copyright since 2007 PrestaShop SA and Contributors
 * PrestaShop is an International Registered Trademark & Property of PrestaShop SA
 *
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Open Software License (OSL 3.0)
 * that is bundled with this package in the file LICENSE.md.
 * It is also available through the world-wide-web at this URL:
 * https://opensource.org/licenses/OSL-3.0
 * If you did not receive a copy of the license and are unable to
 * obtain it through the world-wide-web, please send an email
 * to license@prestashop.com so we can send you a copy immediately.
 *
 * DISCLAIMER
 *
 * Do not edit or add to this file if you wish to upgrade PrestaShop to newer
 * versions in the future. If you wish to customize PrestaShop for your
 * needs please refer to https://devdocs.prestashop.com/ for more information.
 *
 * @author    PrestaShop SA and Contributors <contact@prestashop.com>
 * @copyright Since 2007 PrestaShop SA and Contributors
 * @license   https://opensource.org/licenses/OSL-3.0 Open Software License (OSL 3.0)
 */

import ConfirmModal from '@components/modal';
import ProductMap from '@pages/product/product-map';
import ComponentsMap from '@components/components-map';
import ProductEvents from '@pages/product/product-event-map';
import CombinationsService from '@pages/product/services/combinations-service';
import {EventEmitter} from 'events';
import DisablingToggler from '@components/form/disabling-toggler';

const CombinationMap = ProductMap.combinations;
const CombinationEvents = ProductEvents.combinations;

export default class BulkFormHandler {
  private combinationsService: CombinationsService;

  private eventEmitter: EventEmitter;

  private tabContainer: HTMLDivElement;

  private formModalContent: string;

  constructor() {
    this.combinationsService = new CombinationsService();
    this.eventEmitter = window.prestashop.instance.eventEmitter;
    this.tabContainer = document.querySelector(CombinationMap.externalCombinationTab) as HTMLDivElement;
    const formTemplate = document.querySelector(CombinationMap.bulkCombinationFormTemplate) as HTMLScriptElement;
    this.formModalContent = formTemplate.innerHTML;
    this.init();
  }

  private init(): void {
    this.listenSelections();
    this.eventEmitter.on(CombinationEvents.listRendered, () => this.toggleBulkActions());

    const bulkFormBtn = document.querySelector(CombinationMap.bulkCombinationFormBtn) as HTMLButtonElement;
    bulkFormBtn.addEventListener('click', () => this.showFormModal());
  }

  private showProgressModal(): ConfirmModal {
    //@todo: Replace with new progress modal when introduced in #26004.
    const modal = new ConfirmModal(
      {
        id: CombinationMap.bulkProgressModalId,
        confirmMessage: '<div>Updating combinations: <p class="progress-increment"></p></div>',
      },
      () => null,
    );

    modal.show();

    return modal;
  }

  private showFormModal(): ConfirmModal {
    const modal = new ConfirmModal(
      {
        id: CombinationMap.bulkCombinationModalId,
        confirmMessage: this.formModalContent,
      },
      () => this.submitForm(),
    );

    modal.show();
    const form = document.querySelector(CombinationMap.bulkCombinationForm) as HTMLFormElement;
    const disablingToggles = form.querySelectorAll(ComponentsMap.disablingToggle.wrapper) as NodeListOf<HTMLDivElement>;

    disablingToggles.forEach((element) => {
      const {disablingToggleName} = element.dataset;
      //@todo: could these be set by default inside component?
      const matchingValue = element.dataset.disablingToggleMatchingValue as string;
      const disableOnMatch = !!element.dataset.disablingToggleDisableOnMatch;

      new DisablingToggler(
        `${CombinationMap.bulkCombinationForm} [data-disabling-toggle-name="${disablingToggleName}"] input`,
        matchingValue,
        `${CombinationMap.bulkCombinationForm} [data-toggled-by="${disablingToggleName}"]`,
        disableOnMatch,
      );
    });

    return modal;
  }

  private listenSelections(): void {
    // delegated event listener on tabContainer, because every checkbox is re-rendered with dynamic pagination
    this.tabContainer.addEventListener('change', (e) => {
      if (!(e.target instanceof HTMLInputElement)) {
        return;
      }

      if (e.target.id === CombinationMap.bulkSelectAllInPageId) {
        this.checkAll(e.target.checked);
      }
      this.toggleBulkActions();
    });
  }

  private checkAll(checked: boolean) {
    const allCheckboxes = this.tabContainer
      .querySelectorAll(CombinationMap.tableRow.isSelectedCombination) as NodeListOf<HTMLInputElement>;

    allCheckboxes.forEach((checkbox) => {
      // eslint-disable-next-line no-param-reassign
      checkbox.checked = checked;
    });
  }

  private toggleBulkActions(): void {
    const selectAllCheckbox = document.getElementById(CombinationMap.bulkSelectAllInPageId);
    const btn = this.tabContainer.querySelector(CombinationMap.bulkActionsBtn) as HTMLButtonElement;
    const selectedCombinationsCount = this.getSelectedCheckboxes().length;
    const enable = (selectAllCheckbox instanceof HTMLInputElement && selectAllCheckbox.checked)
      || selectedCombinationsCount !== 0;

    const bulkCombinationsBtn = this.tabContainer.querySelector(CombinationMap.bulkCombinationFormBtn) as HTMLButtonElement;
    const bulkCombinationsLabel = bulkCombinationsBtn.dataset.btnLabel as string;
    bulkCombinationsBtn.innerHTML = bulkCombinationsLabel.replace(/%s/, String(selectedCombinationsCount));

    btn.toggleAttribute('disabled', !enable);
  }

  private async submitForm(): Promise<void> {
    //@todo: form errors should be handled in dedicated PR
    const form = document.querySelector(CombinationMap.bulkCombinationForm) as HTMLFormElement;
    const progressModal = this.showProgressModal();

    const checkboxes = this.getSelectedCheckboxes();
    const progressModalElement = document.getElementById(CombinationMap.bulkProgressModalId);

    let progress = 1;

    for (let i = 0; i < checkboxes.length; i += 1) {
      const checkbox = checkboxes[i];
      // eslint-disable-next-line no-await-in-loop
      await this.combinationsService.bulkUpdate(Number(checkbox.value), $(form).serializeArray());

      //@todo: also related with temporary progress modal. Needs to be fixed according to new progress modal once its merged in #26004.
      const progressContent = progressModalElement?.querySelector('.progress-increment') as HTMLParagraphElement;
      progressContent.innerHTML = String(progress);
      progress += 1;
    }

    progressModal.hide();

    this.eventEmitter.emit(CombinationEvents.bulkUpdateFinished);
  }

  private getSelectedCheckboxes(): NodeListOf<HTMLInputElement> {
    return this.tabContainer
      .querySelectorAll(`${CombinationMap.tableRow.isSelectedCombination}:checked`) as NodeListOf<HTMLInputElement>;
  }
}
