<?php

namespace AppBundle\EventListener;

use Doctrine\ORM\EntityManager;
use Doctrine\ORM\Event\LifecycleEventArgs;
use Doctrine\ORM\Event\PreUpdateEventArgs;
use Doctrine\ORM\Events;
use Doctrine\Common\EventSubscriber;
use AppBundle\Entity\Request;

class RequestSubscriber implements EventSubscriber
{
    /**
     * @var EntityManager
     */
    private $em;

    public function getSubscribedEvents()
    {
        return [
            Events::preUpdate => 'preUpdate',
            Events::prePersist=> 'prePersist',
        ];
    }

    /**
     * Установка регистрационного номера
     * @param $entity
     */
    private function generate($entity)
    {
        if (!($entity instanceof Request)) {
            return;
        }
        if ($entity->getStatus()->getCode() !== 'request_sent' && $entity->getStatus()->getCode() !== 'test_allowed') {
            return;
        }
        if ($entity->getRegNumber()) {
            return;
        }
        $prefix = 'АК-';

        $qb = $this->em
            ->createQuery('SELECT SUBSTRING(r.regNumber, LOCATE(\'-\', r.regNumber)+1)+0 AS reg_int FROM AppBundle:Request r ORDER BY reg_int DESC')
            ->setMaxResults(1)
        ;

        $result = $qb
            ->getOneOrNullResult();

        $increment = (count($result) && array_key_exists('reg_int', $result)) ? intval($result['reg_int']) : 0;

        $increment++;

        $entity->setRegNumber($prefix . $increment);
    }

    public function preUpdate(PreUpdateEventArgs $args)
    {
        if (!$args->hasChangedField('status')) {
            return;
        }

        $this->em = $args->getEntityManager();
        $this->generate($args->getEntity());
    }

    public function prePersist(LifecycleEventArgs $args)
    {
        $this->em = $args->getEntityManager();
        $this->generate($args->getEntity());
    }
}
