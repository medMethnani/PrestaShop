<?php
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
declare(strict_types=1);

namespace PrestaShopBundle\Form\Admin\Type;

use Symfony\Component\Form\FormInterface;
use Symfony\Component\Form\FormView;
use Symfony\Component\OptionsResolver\OptionsResolver;

class DisablingToggleType extends SwitchType
{
    public const DEFAULT_OPTIONS = [
        'disable_on_match' => true,
        'matching_value' => '0',
        'label' => false,
        'row_attr' => [
            'class' => 'ps-disabling-toggle',
        ],
    ];

    /**
     * {@inheritDoc}
     */
    public function configureOptions(OptionsResolver $resolver)
    {
        parent::configureOptions($resolver);

        $resolver
            ->setDefaults(self::DEFAULT_OPTIONS)
            ->setAllowedTypes('disable_on_match', 'bool')
            ->setAllowedTypes('matching_value', ['string'])
        ;
    }

    /**
     * {@inheritDoc}
     */
    public function buildView(FormView $view, FormInterface $form, array $options)
    {
        parent::buildView($view, $form, $options);
        $view->vars['row_attr']['data-disabling-toggle-name'] = $form->getName();
        $view->vars['row_attr']['data-disabling-toggle-disable-on-match'] = $options['disable_on_match'];
        //@todo: if i try to assign boolean it doesnt work as e.g. with false the value is empty in data attr and js part fails
        $view->vars['row_attr']['data-disabling-toggle-matching-value'] = (string) $options['matching_value'];
    }

    public function getParent(): string
    {
        return SwitchType::class;
    }
}
