// function TokenRequest(mhId,PId){
// 	at Proxy , RequestQueue.add(mhId,PId)
// 	at MSS, init_Proxy.add(mhId, PId) 
	
// }

// function GlobalMove(newPId,newMSSId,mhId){ #New PId, new MSSId values passed
// 	newMSSId.init_Proxy(mhId,init_Proxy)
	 
// }

// function PassToken(PId){
// 	for loop to iterate PId in RequestQueue:
// 		if PId = RequestQueue.Contains(PId )
// 		RequestQueue.remove(mhId,PId)
// 		GrantQueue.add(PId,mhId)
// 		If mh moved : false
// 			call mhNotMoved(mhId)
// 		else
// 			call mhMoved()
// 		Wait for Returntoken()
// }

// function mhNotMoved(PId){
	
// 	Search for mhId under MSS with init_Proxy
// }

// function mhMoved(PId){
// 	Move the request from GrantQueue to RequestQueue with new Proxy Id
// }




// # Requesting token by MH
// def RequestToken(mhId,mhCounterValue):

//   #Adding request to its LocalMSS Queue
//   Req1 = mhId.mss.deliverQueue.join(mhId,mhCounterValue) 
//   Req1 = Undeliverable; 

//   for mss in M_MSS:
//     if mhId.mss == mss:
//       pass
//       #Ignore
//     else:
//       #connecting with other MSSs
//       ConnectWithOtherMSS(Req1,mhId.mss, mss,updatedCounterValue = 0)

//   FinalOrderValue = Max(ListOrder)
//   for mss in M_MSS:
//     if mhId.mss == mss:
//       Req1 = Deliverable # Mark is it as deliverable
//       grant("Req1") #send grant message(Req1) to mhId
//     else:
//       #connecting with other MSSs
//       ConnectWithOtherMSS(Req1,mhId.mss, mss,updatedCounterValue = FinalOrderValue)

// def ConnectWithOtherMSS(Req1,mhId_mss, mss,updatedCounterValue = 0):
//   # in def conectWithOtherMSS replaced mhId.mss wiht mhId_mss  
//   if updatedCounterValue == 0:
//     lengthDeliveryQueue = mss.deliverQueue
//     mss.deliverQueue.join(Req1,mhId,lengthDeliveryQueue+1)
//     ConnectWithCoordinatorMSS(mhId_mss,mss,lengthDeliveryQueue+1)
//   else:
//     Req1.Order = updatedCounterValue
//     Req1 = Deliverable #Mark it as Deliverable


// def ConnectWithCoordinatorMSS(mhId_mss,mss, lengthDeliveryQueue):
//   # in def conectWithOtherMSS replaced mhId.mss wiht mhId_mss 
//   # removed +1 from the arguments
//   # Each MSS sends counter value to coordinator MSS
//   # coordinator MSS maintains List of counter values
//   mhId_mss.ListOrder.add(lengthDeliveryQueue+1)
  

// def ReqestCompleted(mhId,Req1):
//   #First Request need to be deleted from localMSS
//   mhId.mss.deliverQueue.delete(Req1)

//   #Deleting req from other MSSs
//   for mss in M_MSS:
//     if mhId.mss == mss:
//       #Ignore
//       pass   #inserted the pass statement
//     else:
//       mss.deliverQueue.delete(Req)