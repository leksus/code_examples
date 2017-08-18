<?php

namespace My\Controller;

use My\Model\OutgoingCommandDelete;
use My\Manager\OrderManager;
use My\Controller\CreditDefaultController as Controller;
use My\Entity\Order;
use Symfony\Component\HttpFoundation\Request;

/**
 * @package My\Controller
 */
class DostrahovanieController extends Controller
{
    public function calculateAction(Request $request, $orderId)
    {
        /** @var \My\Entity\Order $order */
        $order = $this->getDoctrine()->getRepository('PartnersCreditBundle:Order')->find($orderId);
        if (!$order){
            return $this->getErrorResponse('Договор не найден');
        }

        $dataSend = $request->get('dataSend');

        if (!$dataSend) {
            $data = json_decode($request->getContent(), true);
            $dataSend = $data['dataSend'];
        }

        $dateStart = $dataSend['dateStart'];
        $duration = $dataSend['duration'];

        /** @var \My\Manager\OrderManager $orderManager */
        $orderManager = $this->container->get('partners_order_manager');
        /** @var Order $clonedOrder */
        $clonedOrder = $orderManager->generateEmptyOrder($order->getProduct(), null);

        $clonedOrder->setDateStart(new \DateTime($dateStart));
        $clonedOrder->setDuration($duration);
        $orderManager->cloneOrderPersons($order, $clonedOrder, true);
        $orderManager->cloneOrderCalculation($order, $clonedOrder);

        $this->getDoctrine()->getManager()->persist($clonedOrder);
        $this->getDoctrine()->getManager()->flush();

        $data = array_merge($order->getDefaultCalculation()->getCalculation()->toArray(false), $dataSend);

        /** @var \My\Manager\CalculationManager $calculationManager */
        $calculationManager = $this->container->get('partners_calculation_manager');

        if(!$calculationManager->calculate($clonedOrder, $data)) {
            return $this->getErrorResponse('Calculation is not completed: '
                .implode(', ', $calculationManager->getErrors()));
        }

        $sp1 = $order->getDefaultCalculation()->getPremium();
        $do1 = $order->getDateEnd();
        $dn1 = $order->getDateStart();
        $dn2 = new \DateTime($dateStart);

        $sp2 = $clonedOrder->getDefaultCalculation()->getPremium();
        /**
         * formula: СП3=округл(СП1*(ДО1-ДН2)/((ДО1-ДН1)+1);2)
         */
        $sp3 = round($sp1*($do1->diff($dn2)->d)/(($do1->diff($dn1)->d)+1), 2);
        $spd = $sp2-$sp3;

        $result = [
            'sp2' => $sp2,
            'sp3' => $sp3,
            'spd' => $spd,
            'orderId' => $clonedOrder->getId()
        ];
        return $this->getSuccessResponse(['calc' => $result]);
    }

    public function cancelOrderAction($orderId)
    {
        /** @var \My\Entity\Order $order */
        $order = $this->getDoctrine()->getRepository('PartnersCreditBundle:Order')->find($orderId);
        if (!$order){
            return $this->getErrorResponse('Order not found');
        }
        $outgoingCommand = new OutgoingCommandDelete();
        $commandResult = $outgoingCommand->execute(['order' => $order]);

        if (!$commandResult) {
            return $this->getErrorResponse($outgoingCommand->getErrorText());
        }

        return $this->getSuccessResponse();
    }
}
