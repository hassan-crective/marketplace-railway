
import { Router } from 'express';
import { authenticateJWT } from '../../middlewares/auth.middleware';
import  withdrawalRequest  from '../../controllers/withdrawal.controller';
import { authorizeRole } from '../../middlewares/role.middleware';
import { Others } from '../../enums/others.enum';

const withdrawalRouter = Router();

withdrawalRouter.post('/withdrawal/request', authenticateJWT,authorizeRole(Others.role.PUBLISHER) ,withdrawalRequest.createWithdrawalRequest);
withdrawalRouter.get('/fetchInvoices', authenticateJWT, authorizeRole(Others.role.PUBLISHER)  ,withdrawalRequest.fetchInvoices);
withdrawalRouter.get('/fetchWithdrawalRequest', authenticateJWT,authorizeRole(Others.role.MODERATOR , Others.role.ADMIN , Others.role.SUPERADMIN) , withdrawalRequest.getWithdrawalRequestsController);

export default withdrawalRouter;
