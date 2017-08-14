<?php

namespace Sales\ApiBundle\Controller;

use Sales\SaleBundle\Entity\Agent;
use Sales\UserBundle\Entity\Operator;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;

class ApiController extends Controller
{
    public function getAction(Request $request)
    {
        $dataRaw = $request->get('data', false);
        if (!$dataRaw) {
            return $this->render('SalesApiBundle:Api:base.json.twig', array('data' => array(
                    'status' => 'ERROR',
                    'text' => '1 Данные не переданы',
                ))
            );
        }

        $dataRaw = json_decode($dataRaw, true);
        if (!$dataRaw) {
            return $this->render('SalesApiBundle:Api:base.json.twig', array('data' => array(
                    'status' => 'ERROR',
                    'text' => '1-1 Данные не в требуемом формате',
                ))
            );
        }

        if (!array_key_exists('key', $dataRaw) && !$dataRaw['key']){
            return $this->render('SalesApiBundle:Api:base.json.twig', array('data' => array(
                    'status' => 'ERROR',
                    'text' => '2 Отутсвует ключ авторизации',
                ))
            );
        }
        $key = $dataRaw['key'];

        if (!array_key_exists('mode', $dataRaw) && !$dataRaw['mode']){
            return $this->render('SalesApiBundle:Api:base.json.twig', array('data' => array(
                    'status' => 'ERROR',
                    'text' => '3 Отутсвует определение операции авторизации',
                ))
            );
        }

        $data = array();
        if (array_key_exists('data', $dataRaw) && is_array($dataRaw['data'])){
            $data = $dataRaw['data'];
        }

        switch ($dataRaw['mode']){
            case 'get_agent':

                $ag_num = intval($data['ag_num']);

                /**
                 * Размечаем ответ на запрос
                 */
                $result = [
                    'ag_num'    => $ag_num,
                    'fio'       => '',
                    'username'  => ''
                ];

                /**
                 * Ищем агента по АД
                 */
                /** @var Agent $agent */
                $agent = $this->getDoctrine()->getRepository('SalesSaleBundle:Agent')->findOneBy(['num' => $ag_num]);

                if ($agent) {

                    $result['fio'] = $agent->getFio();

                    /**
                     * Если найден агент проходим всех его операторов
                     */
                    /** @var Operator $operator */
                    foreach ($agent->getOperators() as $operator) {
                        /**
                         * Проверяем у оператора пользователя
                         * если находим, отдаем username
                         */
                        if ($operator->getUser()) {
                            $result['username'] = $operator->getUser()->getUsername();
                            break;
                        }
                    }
                    if ($result['username'] == '') {
                        /**
                         * Если не найден через оператора, то ищем пользователя с username = ag_num
                         * и отдаем username
                         */
                        $user = $this
                            ->getDoctrine()
                            ->getRepository('SalesUserBundle:User')
                            ->findOneBy(['usernameCanonical' => $ag_num]);
                        if ($user) {
                            $result['username'] = $user->getUsername();
                        }
                    }
                } else {
                    return $this->render('SalesApiBundle:Api:base.json.twig', array('data' => array(
                            'status' => 'ERROR',
                            'text' => 'Не найден агент с таким номером',
                        ))
                    );
                }

                break;
            default:
                return $this->render('SalesApiBundle:Api:base.json.twig', array('data' => array(
                        'status' => 'ERROR',
                        'text' => 'Неизвестная операция',
                    ))
                );
                break;
        }

        return $this->render('SalesApiBundle:Api:base.json.twig', array('data' => array(
                'status' => 'OK',
                "error_text" => "",
                "mode" => $dataRaw['mode'],
                'data' => $result,
            ))
        );
    }

}
