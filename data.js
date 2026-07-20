window.IR_DATA = {
  books: [
    ['GEN','Gênesis',50,'old'],['EXO','Êxodo',40,'old'],['LEV','Levítico',27,'old'],['NUM','Números',36,'old'],['DEU','Deuteronômio',34,'old'],['JOS','Josué',24,'old'],['JDG','Juízes',21,'old'],['RUT','Rute',4,'old'],['1SA','1 Samuel',31,'old'],['2SA','2 Samuel',24,'old'],['1KI','1 Reis',22,'old'],['2KI','2 Reis',25,'old'],['1CH','1 Crônicas',29,'old'],['2CH','2 Crônicas',36,'old'],['EZR','Esdras',10,'old'],['NEH','Neemias',13,'old'],['EST','Ester',10,'old'],['JOB','Jó',42,'old'],['PSA','Salmos',150,'old'],['PRO','Provérbios',31,'old'],['ECC','Eclesiastes',12,'old'],['SNG','Cânticos',8,'old'],['ISA','Isaías',66,'old'],['JER','Jeremias',52,'old'],['LAM','Lamentações',5,'old'],['EZK','Ezequiel',48,'old'],['DAN','Daniel',12,'old'],['HOS','Oséias',14,'old'],['JOL','Joel',3,'old'],['AMO','Amós',9,'old'],['OBA','Obadias',1,'old'],['JON','Jonas',4,'old'],['MIC','Miquéias',7,'old'],['NAM','Naum',3,'old'],['HAB','Habacuque',3,'old'],['ZEP','Sofonias',3,'old'],['HAG','Ageu',2,'old'],['ZEC','Zacarias',14,'old'],['MAL','Malaquias',4,'old'],
    ['MAT','Mateus',28,'new'],['MRK','Marcos',16,'new'],['LUK','Lucas',24,'new'],['JHN','João',21,'new'],['ACT','Atos',28,'new'],['ROM','Romanos',16,'new'],['1CO','1 Coríntios',16,'new'],['2CO','2 Coríntios',13,'new'],['GAL','Gálatas',6,'new'],['EPH','Efésios',6,'new'],['PHP','Filipenses',4,'new'],['COL','Colossenses',4,'new'],['1TH','1 Tessalonicenses',5,'new'],['2TH','2 Tessalonicenses',3,'new'],['1TI','1 Timóteo',6,'new'],['2TI','2 Timóteo',4,'new'],['TIT','Tito',3,'new'],['PHM','Filemom',1,'new'],['HEB','Hebreus',13,'new'],['JAS','Tiago',5,'new'],['1PE','1 Pedro',5,'new'],['2PE','2 Pedro',3,'new'],['1JN','1 João',5,'new'],['2JN','2 João',1,'new'],['3JN','3 João',1,'new'],['JUD','Judas',1,'new'],['REV','Apocalipse',22,'new']
  ].map(([id,name,chapters,testament])=>({id,name,chapters,testament})),
  daily: [
    ['PSA',23,1,'O Senhor é o meu pastor; nada me faltará.'],['PHP',4,13,'Posso todas as coisas naquele que me fortalece.'],['PRO',3,5,'Confia no Senhor de todo o teu coração, e não te estribes no teu próprio entendimento.'],['ISA',41,10,'Não temas, porque eu sou contigo; não te assombres, porque eu sou teu Deus.'],['JHN',8,12,'Eu sou a luz do mundo; quem me segue não andará em trevas, mas terá a luz da vida.'],['ROM',12,12,'Alegrai-vos na esperança, sede pacientes na tribulação, perseverai na oração.'],['PSA',119,105,'Lâmpada para os meus pés é tua palavra, e luz para o meu caminho.']
  ],
  topics: {
    'Fé':[['HEB',11,1],['ROM',10,17],['MRK',11,24]],
    'Esperança':[['ROM',15,13],['JER',29,11],['PSA',42,11]],
    'Sabedoria':[['PRO',3,5],['JAS',1,5],['PRO',16,16]],
    'Família':[['JOS',24,15],['COL',3,13],['PRO',22,6]],
    'Paz':[['PHP',4,7],['JHN',14,27],['ISA',26,3]],
    'Oração':[['MAT',6,6],['PHP',4,6],['1TH',5,17]],
    'Gratidão':[['1TH',5,18],['PSA',100,4],['COL',3,17]],
    'Coragem':[['JOS',1,9],['PSA',27,1],['DEU',31,8]]
  },
  plans: [
    {id:'jesus-7',title:'Conhecendo Jesus',description:'Sete encontros com a vida e os ensinamentos de Jesus.',color:'sage',days:[['JHN',1],['JHN',3],['MAT',5],['LUK',15],['JHN',10],['JHN',15],['JHN',20]]},
    {id:'esperanca-7',title:'Recomeçar com esperança',description:'Uma semana para renovar o coração e seguir em frente.',color:'sunrise',days:[['PSA',23],['ISA',40],['LAM',3],['MAT',6],['ROM',8],['PHP',4],['REV',21]]},
    {id:'sabedoria-21',title:'Uma vida de sabedoria',description:'Provérbios práticos para decisões e relacionamentos.',color:'calm',days:Array.from({length:21},(_,i)=>['PRO',i+1])},
    {id:'salmos-30',title:'30 dias com os Salmos',description:'Um mês de oração, louvor e confiança.',color:'dusk',days:Array.from({length:30},(_,i)=>['PSA',i+1])}
  ]
};