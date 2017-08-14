<?php

namespace Partners\CreditBundle\Controller;

use Partners\CreditBundle\Controller\CreditDefaultController as Controller;
use Partners\CreditBundle\Entity\Instalment;
use Symfony\Component\HttpFoundation\Response;

/**
 * Контроллер рассрочки
 * Class InstalmentController
 * @package Partners\CreditBundle\Controller
 */
class InstalmentController extends Controller
{
    /**
     * @param integer $orderId
     * @return Response
     */
    public function saveAction($orderId)
    {
        $order = $this->getDoctrine()->getRepository('PartnersCreditBundle:Order')->find($orderId);

        if ($order) {
            $instalments = $this->get('partners_instalment_manager')->generateInstalment($order);
            if ($instalments) {
                $result = [];
                /** @var Instalment $instalment */
                foreach ($instalments as $instalment) {
                    /**
                     * возвращаем рассрочки для формирования таблицы
                     */
                    $result[] = [
                        'date' => $instalment->getDateStartPayment()->format('d.m.Y'),
                        'sum'  => $instalment->getPaymentSum()
                    ];
                }
                return $this->getSuccessResponse(['instalments' => $result]);
            } else {
                return $this->getErrorResponse('Не удалось создать рассрочку. Возможно для данного продукта не поддерживается данная функция');
            }
        }

        return $this->getErrorResponse('Не найден договор');
    }

    /**
     * @param integer $orderId
     * @return Response
     */
    public function deleteAction($orderId)
    {
        $order = $this->getDoctrine()->getRepository('PartnersCreditBundle:Order')->find($orderId);

        if ($order) {
            if (!$this->get('partners_instalment_manager')->removeInstalment($order)) {
                return $this->getErrorResponse('Не удалось удалить');
            }
            return $this->getSuccessResponse([]);
        }

        return $this->getErrorResponse('Не найден договор');
    }
}
