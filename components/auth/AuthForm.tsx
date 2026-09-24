"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Building2, Eye, EyeOff, Globe2, LockKeyhole, Mail, UserRound } from "lucide-react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

type Mode = "login"|"signup"|"forgot";
export default function AuthForm({mode}:{mode:Mode}) {
 const router=useRouter(); const [show,setShow]=useState(false); const [loading,setLoading]=useState(false); const [error,setError]=useState(""); const [sent,setSent]=useState(false);
 async function submit(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();setLoading(true);setError(""); const fd=new FormData(e.currentTarget); const email=String(fd.get("email")); const password=String(fd.get("password")||"");
  try{
   const supabase=createClient();
   if(!supabase){ await new Promise(r=>setTimeout(r,650)); localStorage.setItem("closeai_demo_session",JSON.stringify({email,name:fd.get("name")||"Aïcha Mensah"})); if(mode==="forgot")setSent(true); else router.push(mode==="signup"?"/onboarding":"/dashboard"); return; }
   if(mode==="login"){ const {error}=await supabase.auth.signInWithPassword({email,password}); if(error)throw error;router.push("/dashboard"); }
   else if(mode==="signup"){ const {error}=await supabase.auth.signUp({email,password,options:{emailRedirectTo:`${location.origin}/verify-email`,data:{full_name:fd.get("name"),company:fd.get("company"),industry:fd.get("industry"),country:fd.get("country"),language:fd.get("language"),goal:fd.get("goal")}}});if(error)throw error;router.push("/verify-email?email="+encodeURIComponent(email)); }
   else { const {error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:`${location.origin}/login`});if(error)throw error;setSent(true); }
  }catch(err){setError(err instanceof Error?err.message:"Une erreur est survenue.");}finally{setLoading(false)}
 }
 if(sent)return <div className="auth-success"><Mail/><h3>Vérifiez votre boîte email</h3><p>Un lien sécurisé vient de vous être envoyé. Pensez à vérifier vos spams.</p><Link className="btn btn-secondary" href="/login">Retour à la connexion</Link></div>;
 return <form onSubmit={submit} className="auth-form">
  {!isSupabaseConfigured&&<div className="demo-alert"><SparklesMini/> Mode démonstration — utilisez n’importe quels identifiants.</div>}
  {mode==="signup"&&<>
   <div className="auth-row"><Field name="name" label="Nom complet" icon={<UserRound/>} placeholder="Aïcha Mensah" required/><Field name="company" label="Entreprise" icon={<Building2/>} placeholder="Nova Commerce" required/></div>
   <div className="auth-row"><SelectField name="industry" label="Secteur" options={["E-commerce","Agence","Coaching / Formation","SaaS / Technologie","Services professionnels","Immobilier","Autre"]}/><SelectField name="country" label="Pays" icon={<Globe2/>} options={["Burkina Faso","Côte d’Ivoire","Sénégal","France","Belgique","Canada","Maroc","Autre"]}/></div>
   <div className="auth-row"><SelectField name="language" label="Langue" options={["Français","English","Español","Português","العربية"]}/><SelectField name="goal" label="Objectif principal" options={["Répondre plus vite","Convertir plus de prospects","Automatiser les réponses","Qualifier les prospects","Améliorer les relances"]}/></div>
  </>}
  <Field name="email" label="Adresse email" type="email" icon={<Mail/>} placeholder="vous@entreprise.com" required/>
  {mode!=="forgot"&&<div className="field"><div className="label-line"><label htmlFor="password">Mot de passe</label>{mode==="login"&&<Link href="/forgot-password">Mot de passe oublié ?</Link>}</div><div className="input-icon"><LockKeyhole/><input id="password" name="password" type={show?"text":"password"} placeholder={mode==="signup"?"8 caractères minimum":"Votre mot de passe"} minLength={8} required/><button type="button" onClick={()=>setShow(!show)}>{show?<EyeOff/>:<Eye/>}</button></div></div>}
  {error&&<div className="form-error">{error}</div>}
  <button className="btn btn-primary auth-submit" disabled={loading}>{loading?<span className="spinner"/>:<>{mode==="login"?"Se connecter":mode==="signup"?"Créer mon compte":"Envoyer le lien"}<ArrowRight/></>}</button>
  {mode==="login"&&<p className="auth-switch">Nouveau sur CloseAI ? <Link href="/signup">Créer un compte</Link></p>}
  {mode==="signup"&&<p className="auth-switch">Déjà un compte ? <Link href="/login">Se connecter</Link></p>}
 </form>
}
function Field({name,label,icon,placeholder,type="text",required}:{name:string;label:string;icon:React.ReactNode;placeholder:string;type?:string;required?:boolean}){return <div className="field"><label htmlFor={name}>{label}</label><div className="input-icon">{icon}<input id={name} name={name} type={type} placeholder={placeholder} required={required}/></div></div>}
function SelectField({name,label,options,icon}:{name:string;label:string;options:string[];icon?:React.ReactNode}){return <div className="field"><label htmlFor={name}>{label}</label><div className="input-icon select-icon">{icon}<select id={name} name={name}>{options.map(x=><option key={x}>{x}</option>)}</select></div></div>}
function SparklesMini(){return <span style={{fontSize:13}}>✦</span>}
