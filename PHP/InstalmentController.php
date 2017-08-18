<?php

namespace My\Controller;

use My\Controller\CreditDefaultController as Controller;
use My\Entity\Instalment;
use Symfony\Component\HttpFoundation\Response;

/**
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

        if (!$order) {
            return $this->getErrorResponse('Order not found');
        }

        $instalments = $this->get('partners_instalment_manager')->generateInstalment($order);
        if ($instalments) {
            return $this->getErrorResponse('Installments is not created');
        }

        $result = [];
        /** @var Instalment $instalment */
        foreach ($instalments as $instalment) {
            $result[] = [
                'date' => $instalment->getDateStartPayment()->format('d.m.Y'),
                'sum'  => $instalment->getPaymentSum()
            ];
        }

        return $this->getSuccessResponse(['instalments' => $result]);
    }

    /**
     * @param integer $orderId
     * @return Response
     */
    public function deleteAction($orderId)
    {
        $order = $this->getDoctrine()->getRepository('PartnersCreditBundle:Order')->find($orderId);

        if (!$order) {

            return $this->getErrorResponse('Order not found');
        }
        if (!$this->get('partners_instalment_manager')->removeInstalment($order)) {
            return $this->getErrorResponse('Instalment is not deleted');
        }
        return $this->getSuccessResponse();
    }
}
