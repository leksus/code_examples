<?php

namespace AppBundle\Controller;
use AppBundle\Entity\CompiledResult;
use AppBundle\Entity\Request;

use AppBundle\Entity\UserSnapshot;
use AppBundle\Helper\PrecomHelper;
use AppBundle\Helper\TestResultHelper;
use \RestBundle\Controller;
use \RestBundle\Traits;
use FOS\RestBundle\Controller\Annotations\View;
use Sensio\Bundle\FrameworkExtraBundle\Configuration\ParamConverter;
use AppBundle\Form\RequestType;
use Sensio\Bundle\FrameworkExtraBundle\Configuration\Route;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request as HttpRequest;
use FOS\RestBundle\Controller\Annotations\RouteResource;
use Doctrine\Common\Annotations\Annotation\IgnoreAnnotation;

/**
 * Контроллер заявок
 * @RouteResource("request")
 * @IgnoreAnnotation("Action")
 * @IgnoreAnnotation("ActionProxy")
 */
class RequestController extends Controller
{
    use Traits\ControllerRead {
        Traits\ControllerRead::cgetAction as getCollection;
        Traits\ControllerRead::getAction as getOne;
    }
    use Traits\ControllerCreate {
        Traits\ControllerCreate::cpostAction as create;
    }
    use Traits\ControllerBind;
    use Traits\ControllerUpdate {
        Traits\ControllerUpdate::putAction as update;
    }



    /**
     * @Action(code="read")
     * @View(serializerEnableMaxDepthChecks=true,serializerGroups={"request"})
     */
    public function cgetAction (HttpRequest $request) {
        return $this->getCollection($request);
    }
    /**
     * @Action(code="read")
     * @View(serializerEnableMaxDepthChecks=true,serializerGroups={"request"})
     *  @ParamConverter("entity", converter="rest_converter")
     */
    public function getAction ($entity) {
        return $this->getOne($entity);
    }

    public function postAction(HttpRequest $request) {
        return $this->create($request);
    }
    /**
     *
     * @Action(code="update")
     * @View(serializerEnableMaxDepthChecks=true)
     * @param \Symfony\Component\HttpFoundation\Request $request
     * @ParamConverter("entity", converter="rest_converter")
     * @param type $entity
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function putAction(HttpRequest $request,$entity)
    {
        TestResultHelper::saveCompiledResults($request, $entity, $this->getDoctrine()->getManager());
        return $this->update($request, $entity);
    }

    /**
     * Возвращает имя класса сущности
     * @return type
     */
    public static function entityClass()
    {
        return Request::class;
    }

    public static function type()
    {
        return RequestType::class;
    }

    /**
     * Копирует результаты тестирования между заявками
     * @Route("/api/{requestId}/copy_results", name="copy_results");
     */
    public function copyResultsAction($requestId)
    {
        $em = $this->container->get('doctrine')->getManager();
        $request = $em->find('AppBundle:Request', $requestId);
        if (!$request) {
            throw new \Exception('Заявка не найдена');
        }
        if ($request->getCompiledResult()) {
            throw new \Exception('Результаты уже присутствуют в заявке');
        }

        $oldCompiledResult = null;

        $testDate = new \DateTime();
        $testDate->modify($this->getParameter('keep_results_params.modify_string'));
        $snapshots = $request->getUserSnapshot()->getUser()->getUserSnapshots();
        $counter = 0;
        foreach ($snapshots as $snapshot) {
            if(!$snapshot->getRequest()) {
                continue;
            }
            if ($request->getId() == $snapshot->getRequest()->getId()) {
                continue;
            }
            /** @var CompiledResult $tempCompiledResult */
            $tempCompiledResult = $snapshot->getRequest()->getCompiledResult();
            if (!$tempCompiledResult) {
                continue;
            }
            $compiledDate = $tempCompiledResult->getDateTime();
            //Если результаты успешны и они входят в заявку, которая находится в интервале
            // (текущая дата - интервал поиска; дата текущей заявки] - то мы принимаем их
            if ($tempCompiledResult->getIsSuccess()
                && ($compiledDate > $testDate) && $compiledDate <= $request->getDate()
            ) {
                if ($snapshot->getRequest()->getAttestationDecision()->getAttestation()->getDuration() == 0) {
                    $counter++;
                } else {
                    $counter = 0;
                }
                $oldCompiledResult = $tempCompiledResult;
            }
        }
        if (!$oldCompiledResult) {
            throw new \Exception('Отсутствуют положительные результаты у пользователя');
        }
        if ($counter >= 4) {
            throw new \Exception('3 заявки подряд не аттестованы, необходимо сдавать тестирование заново');
        }

        $newCompiledResult = clone $oldCompiledResult;
        $newCompiledResult->setRequest($request);
        $em->persist($newCompiledResult);
        $status = $em->getRepository('AppBundle:RequestStatus')->findOneBy(['code' => 'test_passed']);
        $request->setStatus($status);

        $em->flush();

        $response = new \stdClass();
        $response->message = 'Действующий результаты успешно применены';
        return new JsonResponse($response);
    }

}
