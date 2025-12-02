
import React, { useState } from 'react';

interface PaymentGatewayProps {
  onPaymentSuccess: (isTrial: boolean) => void;
}

// Algoritmo de Luhn para validar cartões de crédito reais/válidos matematicamente
const luhnCheck = (val: string) => {
    let checksum = 0;
    let j = 1;
    for (let i = val.length - 1; i >= 0; i--) {
      let calc = 0;
      calc = Number(val.charAt(i)) * j;
      if (calc > 9) {
        checksum = checksum + 1;
        calc = calc - 10;
      }
      checksum = checksum + calc;
      if (j === 1) {j = 2} else {j = 1};
    }
    return (checksum % 10) === 0;
};

const TrustIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-orix-cyan flex-shrink-0">
        <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
    </svg>
);

export const PaymentGateway: React.FC<PaymentGatewayProps> = ({ onPaymentSuccess }) => {
  // Payment State
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  
  // Trial/Registration State
  const [showTicketInput, setShowTicketInput] = useState(false);
  const [ticketCode, setTicketCode] = useState('');
  const [regName, setRegName] = useState('');
  const [regSurname, setRegSurname] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');

  // UI State
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isTrialSuccess, setIsTrialSuccess] = useState(false);

  // --- MASKS ---
  const handleCardNumber = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '').substring(0, 16);
    val = val.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(val);
  };

  const handleExpiry = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '').substring(0, 4);
    if (val.length >= 2) {
      val = val.substring(0, 2) + '/' + val.substring(2);
    }
    setExpiry(val);
  };

  const handleCvv = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCvv(e.target.value.replace(/\D/g, '').substring(0, 4));
  };

  const handlePhone = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '').substring(0, 11);
    // Mask: (XX) XXXXX-XXXX or (XX) XXXX-XXXX
    if (val.length > 2) val = `(${val.substring(0,2)}) ${val.substring(2)}`;
    if (val.length > 9) val = `${val.substring(0,9)}-${val.substring(9)}`; // (XX) XXXXX-XXXX
    setRegPhone(val);
  };

  // --- LOGIC ---

  const checkTrialDuplication = (email: string, phone: string) => {
      try {
          const registeredUsers = JSON.parse(localStorage.getItem('orix_registered_users') || '[]');
          // Clean phone for comparison
          const cleanPhone = phone.replace(/\D/g, '');
          
          return registeredUsers.some((user: any) => 
              user.email.toLowerCase() === email.toLowerCase() || 
              user.phone === cleanPhone
          );
      } catch (e) {
          return false;
      }
  };

  const registerTrialUser = (email: string, phone: string, name: string) => {
      try {
          const registeredUsers = JSON.parse(localStorage.getItem('orix_registered_users') || '[]');
          const cleanPhone = phone.replace(/\D/g, '');
          registeredUsers.push({
              email: email.toLowerCase(),
              phone: cleanPhone,
              name,
              date: new Date().toISOString()
          });
          localStorage.setItem('orix_registered_users', JSON.stringify(registeredUsers));
      } catch (e) {
          console.error("Storage error", e);
      }
  };

  const handleTicketSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      // 1. Basic Validation
      if (!regName.trim() || !regSurname.trim()) {
          setError("Nome e Sobrenome são obrigatórios.");
          return;
      }
      if (regPhone.length < 14) { // (XX) XXXXX-XXXX is approx 15 chars
          setError("Telefone inválido.");
          return;
      }
      if (!regEmail.includes('@') || !regEmail.includes('.')) {
          setError("E-mail inválido.");
          return;
      }

      // 2. Code Validation
      if (ticketCode.toUpperCase() !== '08G') {
          setError("Código inválido ou expirado.");
          return;
      }

      // 3. Duplication Check (Backend Simulation)
      if (checkTrialDuplication(regEmail, regPhone)) {
          setError("ERRO: Este E-mail ou Telefone já utilizou o cupom de teste gratuito anteriormente.");
          return;
      }

      setIsProcessing(true);
      
      setTimeout(() => {
          // Register User
          registerTrialUser(regEmail, regPhone, `${regName} ${regSurname}`);
          
          setIsTrialSuccess(true);
          setSuccess(true);
          setTimeout(() => {
              onPaymentSuccess(true); // TRUE indicates Trial Mode
          }, 2000);
      }, 1500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsProcessing(true);

    // Validation
    const cleanCard = cardNumber.replace(/\s/g, '');
    
    if (cleanCard.length < 13 || !luhnCheck(cleanCard)) {
        setIsProcessing(false);
        setError("Número de cartão inválido. Verifique os dados.");
        return;
    }

    if (cardName.trim().length < 3) {
        setIsProcessing(false);
        setError("Nome do titular inválido.");
        return;
    }
    
    if (cvv.length < 3) {
        setIsProcessing(false);
        setError("CVV inválido.");
        return;
    }

    // Simulate Processing Delay
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    console.log("Processando pagamento de R$ 29,99...");
    console.log("Iniciando transferência automática para PIX: (24)999241876");

    setIsTrialSuccess(false);
    setSuccess(true);
    
    setTimeout(() => {
        onPaymentSuccess(false); // FALSE indicates Full Payment (Not Trial)
    }, 2000);
  };

  if (success) {
    return (
        <div className="w-full max-w-md mx-auto glass-panel p-8 rounded-3xl border border-orix-blue shadow-neon-blue flex flex-col items-center justify-center text-center animate-in zoom-in-95">
             <div className="w-20 h-20 rounded-full bg-orix-blue/20 flex items-center justify-center mb-6">
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-10 h-10 text-orix-cyan">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                 </svg>
             </div>
             <h2 className="text-2xl font-bold text-white mb-2">
                {isTrialSuccess ? "CADASTRO APROVADO" : "PAGAMENTO APROVADO"}
             </h2>
             <p className="text-orix-silver mb-4">
                {isTrialSuccess ? "Você liberou 2 usos gratuitos." : "Acesso vitalício ao sistema ORIX liberado."}
             </p>
             {!isTrialSuccess && (
                <div className="bg-orix-blue/10 p-3 rounded-lg border border-orix-blue/30 w-full mb-2">
                    <p className="text-xs text-orix-cyan font-mono uppercase">Transferência Automática</p>
                    <p className="text-white font-bold">R$ 29,99 &rarr; PIX (24)9...876</p>
                </div>
             )}
             <p className="text-xs text-orix-silver animate-pulse">Iniciando sistema...</p>
        </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto animate-in slide-in-from-bottom-10 duration-700">
      <div className="text-center mb-8">
         <div className="inline-block p-1 rounded-full bg-gradient-to-r from-orix-blue to-orix-silver shadow-neon-blue mb-4">
            <div className="bg-orix-dark rounded-full p-3">
                <span className="text-3xl block grayscale-0">🔒</span>
            </div>
         </div>
         <h2 className="text-3xl font-mono font-bold text-white mb-1">ACESSO PREMIUM</h2>
         <p className="text-orix-silver text-sm">Libere o Scanner ORIX AI Vitalício</p>
      </div>

      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-orix-blue/30 shadow-lg relative overflow-hidden">
         {/* Background Decoration */}
         <div className="absolute top-0 right-0 w-32 h-32 bg-orix-blue/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

         {/* Ticket Toggle Button */}
         <div className="absolute top-4 right-4 z-20">
             <button 
                onClick={() => setShowTicketInput(!showTicketInput)} 
                className={`flex items-center gap-2 transition-all p-2 rounded-lg ${showTicketInput ? 'text-orix-cyan bg-orix-cyan/10' : 'text-orix-silver hover:text-white hover:bg-white/5'}`}
                title="Tenho um código"
             >
                <span className="text-[10px] font-mono uppercase tracking-widest hidden sm:inline-block">Possui Código?</span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />
                </svg>
             </button>
         </div>

         {showTicketInput ? (
             <div className="mb-6 animate-in slide-in-from-top-2 pt-6">
                 <div className="bg-orix-blue/10 border border-orix-blue/30 p-4 rounded-xl mb-4">
                    <p className="text-sm text-orix-cyan mb-2 font-bold">REGISTRO DE TESTE GRATUITO</p>
                    <p className="text-xs text-orix-silver">Preencha seus dados para ativar o cupom.</p>
                 </div>
                 
                 <div className="space-y-3 mb-4">
                    <div className="grid grid-cols-2 gap-3">
                         <input 
                            type="text" 
                            value={regName}
                            onChange={(e) => setRegName(e.target.value)}
                            placeholder="Nome"
                            className="w-full bg-orix-dark/60 border border-orix-silver/20 rounded-xl px-4 py-3 text-white text-sm focus:border-orix-cyan outline-none"
                        />
                         <input 
                            type="text" 
                            value={regSurname}
                            onChange={(e) => setRegSurname(e.target.value)}
                            placeholder="Sobrenome"
                            className="w-full bg-orix-dark/60 border border-orix-silver/20 rounded-xl px-4 py-3 text-white text-sm focus:border-orix-cyan outline-none"
                        />
                    </div>
                     <input 
                        type="email" 
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="Seu melhor e-mail"
                        className="w-full bg-orix-dark/60 border border-orix-silver/20 rounded-xl px-4 py-3 text-white text-sm focus:border-orix-cyan outline-none"
                    />
                     <input 
                        type="text" 
                        value={regPhone}
                        onChange={handlePhone}
                        placeholder="(DDD) Telefone"
                        maxLength={15}
                        className="w-full bg-orix-dark/60 border border-orix-silver/20 rounded-xl px-4 py-3 text-white text-sm focus:border-orix-cyan outline-none"
                    />
                     <input 
                        type="text" 
                        value={ticketCode}
                        onChange={(e) => setTicketCode(e.target.value)}
                        placeholder="CÓDIGO DO CUPOM"
                        className="w-full bg-orix-dark/60 border border-orix-silver/20 rounded-xl px-4 py-3 text-white uppercase font-mono text-center tracking-[0.2em] focus:border-orix-cyan outline-none"
                    />
                 </div>

                 <button 
                    onClick={handleTicketSubmit}
                    disabled={isProcessing}
                    className={`w-full font-bold py-3 rounded-xl transition-all disabled:opacity-50 ${
                         error && error.includes("ERRO") 
                         ? 'bg-red-500/20 text-red-400 border border-red-500'
                         : 'bg-orix-cyan text-orix-dark hover:bg-white'
                    }`}
                 >
                    {isProcessing ? "VALIDANDO..." : "ATIVAR CÓDIGO"}
                 </button>
                 
                 <button onClick={() => setShowTicketInput(false)} className="w-full text-xs text-orix-silver mt-4 hover:text-white underline">Voltar para cartão de crédito</button>
             </div>
         ) : (
            <div className="flex flex-col mb-6 pt-2">
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm text-orix-silver/60 line-through font-mono">R$ 59,98</span>
                    <span className="bg-orix-cyan/10 text-orix-cyan text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">-50% OFF</span>
                </div>
                <div className="flex justify-between items-end">
                    <span className="text-3xl font-bold text-white tracking-tight">R$ 29,99</span>
                    <span className="bg-orix-blue/20 text-orix-cyan px-2 py-1 rounded text-xs font-mono border border-orix-blue/30 mb-1">ASSINATURA MENSAL</span>
                </div>
            </div>
         )}

         {!showTicketInput && (
            <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Card Number */}
                <div className="space-y-1">
                    <label className="text-xs text-orix-silver font-mono uppercase ml-1">Número do Cartão</label>
                    <div className="relative">
                        <input 
                            type="text" 
                            value={cardNumber}
                            onChange={handleCardNumber}
                            placeholder="0000 0000 0000 0000"
                            className="w-full bg-orix-dark/60 border border-orix-silver/20 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:border-orix-cyan focus:ring-1 focus:ring-orix-cyan outline-none transition-all font-mono"
                        />
                        <div className="absolute right-3 top-3 text-orix-silver/50">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Holder Name */}
                <div className="space-y-1">
                    <label className="text-xs text-orix-silver font-mono uppercase ml-1">Nome no Cartão</label>
                    <input 
                        type="text" 
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value.toUpperCase())}
                        placeholder="NOME COMO NO CARTÃO"
                        className="w-full bg-orix-dark/60 border border-orix-silver/20 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:border-orix-cyan focus:ring-1 focus:ring-orix-cyan outline-none transition-all"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {/* Expiry */}
                    <div className="space-y-1">
                        <label className="text-xs text-orix-silver font-mono uppercase ml-1">Validade</label>
                        <input 
                            type="text" 
                            value={expiry}
                            onChange={handleExpiry}
                            placeholder="MM/AA"
                            className="w-full bg-orix-dark/60 border border-orix-silver/20 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:border-orix-cyan focus:ring-1 focus:ring-orix-cyan outline-none transition-all font-mono text-center"
                        />
                    </div>
                    {/* CVV */}
                    <div className="space-y-1">
                        <label className="text-xs text-orix-silver font-mono uppercase ml-1">CVV</label>
                        <input 
                            type="text" 
                            value={cvv}
                            onChange={handleCvv}
                            placeholder="123"
                            className="w-full bg-orix-dark/60 border border-orix-silver/20 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:border-orix-cyan focus:ring-1 focus:ring-orix-cyan outline-none transition-all font-mono text-center"
                        />
                    </div>
                </div>

                <div className="mt-6 pt-4 border-t border-orix-silver/10 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                        <TrustIcon />
                        <span className="text-[10px] text-orix-silver leading-tight">Pagamento Seguro SSL</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <TrustIcon />
                        <span className="text-[10px] text-orix-silver leading-tight">Cancelamento a qualquer momento</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <TrustIcon />
                        <span className="text-[10px] text-orix-silver leading-tight">Garantia de funcionamento</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <TrustIcon />
                        <span className="text-[10px] text-orix-silver leading-tight">Sem taxas ocultas</span>
                    </div>
                </div>

                <button 
                    type="submit"
                    disabled={isProcessing}
                    className="w-full bg-gradient-to-r from-orix-blue to-orix-cyan text-white font-bold py-4 rounded-xl shadow-neon-blue hover:shadow-[0_0_30px_rgba(59,130,246,0.6)] transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed mt-4 relative overflow-hidden group"
                >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                    <span className="relative flex items-center justify-center gap-2">
                        {isProcessing ? (
                            <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            PROCESSANDO...
                            </>
                        ) : (
                            "PAGAR R$ 29,99 AGORA"
                        )}
                    </span>
                </button>
                
                <p className="text-[10px] text-center text-orix-silver/50 mt-4">
                    Transação Segura Criptografada SSL. A ORIX não armazena os dados do seu cartão.
                </p>
            </form>
         )}

         {error && (
            <div className={`text-xs text-center p-2 rounded border mt-4 ${error.includes("ERRO") || error.includes("inválido") ? 'bg-red-500/10 border-red-500 text-red-400 font-bold' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                {error}
            </div>
         )}
      </div>
    </div>
  );
};
