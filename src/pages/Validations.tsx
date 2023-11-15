import { useMemo, useContext, useState, useEffect, useRef } from "react";
import Select, { SingleValue } from "react-select";
import { useForm, SubmitHandler } from "react-hook-form";
import { ErrorMessage } from "@hookform/error-message";
import {
  useAdminValidations,
  useGetActors,
  useGetProfile,
  useGetValidationDetails,
  useGetValidationList,
  useOrganisationRORSearch,
  useValidationRequest,
  useValidationStatusUpdate,
} from "@/api";
import { AuthContext } from "@/auth";
import { ColumnDef } from "@tanstack/react-table";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  FaCheck,
  FaList,
  FaTimes,
  FaExclamationTriangle,
  FaPlus,
  FaGlasses,
  FaIdBadge,
  FaInfoCircle,
} from "react-icons/fa";
import { CustomTable } from "@/components";
import {
  UserProfile,
  Actor,
  OrganisationRORSearchResultModified,
  ValidationResponse,
  AlertInfo,
  ValidationProps,
} from "@/types";

import { toast } from "react-hot-toast";
import { Row, Col, InputGroup, OverlayTrigger, Tooltip } from "react-bootstrap";

const enum ValidationStatus {
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  REVIEW = "REVIEW",
}

function RequestValidation() {
  const navigate = useNavigate();

  const { keycloak, registered } = useContext(AuthContext)!;

  const { data: profileData } = useGetProfile({
    token: keycloak?.token || "",
    isRegistered: registered,
  });

  const [userProfile, setUserProfile] = useState<UserProfile>();
  const alert = useRef<AlertInfo>({
    message: "",
  });
  useEffect(() => {
    setUserProfile(profileData);
  }, [profileData]);

  const { data: actorsData } = useGetActors({
    size: 100,
    page: 1,
    sortBy: "asc",
  });

  const [actors, setActors] = useState<Actor[]>();
  useEffect(() => {
    setActors(actorsData?.content);
  }, [actorsData]);

  type FormValues = {
    organisation_role: string;
    organisation_id: string;
    organisation_source: string;
    organisation_name: string;
    organisation_website: string;
    actor_id: number;
  };

  const [organisation_id, setOrganisationID] = useState("");
  const [actor_id, setActorID] = useState(-1);
  const [organisation_name, setOrganisationName] = useState("");
  const [organisation_role, setOrganisationRole] = useState("");
  const [organisation_source, setOrganisationSource] = useState("ROR");
  const [organisation_website, setOrganisationWebsite] = useState("");
  const [inputValue, setInputValue] = useState("");

  const {
    register,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      organisation_role: organisation_role,
      organisation_id: organisation_id,
      organisation_source: organisation_source,
      organisation_name: organisation_name,
      organisation_website: organisation_website,
      actor_id: actor_id,
    },
  });

  const { mutateAsync: refetchValidationRequest } = useValidationRequest({
    organisation_role: organisation_role,
    organisation_id: organisation_id,
    organisation_source: organisation_source,
    organisation_name: organisation_name,
    organisation_website: organisation_website,
    actor_id: actor_id,
    token: keycloak?.token || "",
    isRegistered: registered,
  });

  const { data: organisations } = useOrganisationRORSearch({
    name: inputValue,
    page: 1,
    token: keycloak?.token || "",
    isRegistered: registered,
  });

  const onSubmit: SubmitHandler<FormValues> = (data) => {
    setOrganisationRole(data.organisation_role);
    setOrganisationID(data.organisation_id);
    setOrganisationSource(data.organisation_source);
    setOrganisationName(data.organisation_name);
    setOrganisationWebsite(data.organisation_website);
    setActorID(data.actor_id);
    const promise = refetchValidationRequest()
      .catch((err) => {
        alert.current = {
          message: "Error during validation request submission.",
        };
        throw err; // throw again after you catch
      })
      .then(() => {
        alert.current = {
          message: "Validation request succesfully submitted.",
        };
      })
      .finally(() => navigate("/validations"));
    toast.promise(promise, {
      loading: "Submitting",
      success: () => `${alert.current.message}`,
      error: () => `${alert.current.message}`,
    });
  };

  const renderOptions = () => {
    let tmp = [];
    const result: OrganisationRORSearchResultModified[] = [];
    if (organisations?.content) {
      tmp = organisations?.content;
      for (let i = 0; i < tmp.length; i++) {
        const t: OrganisationRORSearchResultModified = {
          value: tmp[i]["name"],
          label: tmp[i]["name"],
          website: tmp[i]["website"],
          id: tmp[i]["id"],
          acronym: tmp[i]["acronym"],
        };
        result.push(t);
      }
      return result;
    } else return [];
  };

  const updateForm = (s: SingleValue<OrganisationRORSearchResultModified>) => {
    setValue("organisation_id", s?.id || "");
    setValue("organisation_name", s?.value || "");
    setValue("organisation_website", s?.website || "");
  };

  const actors_select_div = (
    <>
      <label
        htmlFor="actors"
        className="d-flex align-items-center form-label fw-bold"
      >
        <FaInfoCircle className="me-2" /> Actor (*)
      </label>
      <OverlayTrigger
        key="top"
        placement="top"
        overlay={
          <Tooltip id={`tooltip-top`}>
            The organisation’s role (actor) as defined in the EOSC PID Policy
          </Tooltip>
        }
      >
        <select
          className={`form-select ${errors.actor_id ? "is-invalid" : ""}`}
          id="actor_id"
          {...register("actor_id", {
            required: true,
          })}
        >
          <option disabled value={-1}>
            Select Actor
          </option>
          {actors &&
            actors.map((t, i) => {
              return (
                <option key={`type-${i}`} value={t.id}>
                  {t.name}
                </option>
              );
            })}
        </select>
      </OverlayTrigger>
      <ErrorMessage
        errors={errors}
        name="actor_id"
        render={({ message }) => <p>{message}</p>}
      />
    </>
  );

  return (
    <div className="mt-4">
      <h3 className="cat-view-heading">
        <FaIdBadge /> create new validation request
      </h3>
      <form className="mt-4" onSubmit={handleSubmit(onSubmit)}>
        <Row>
          <Col className="mt-3" xs={12} md={6}>
            <label
              htmlFor="organization_name"
              className="d-flex align-items-center form-label fw-bold"
            >
              <FaInfoCircle className="me-2" /> Organization Name (*)
            </label>
            <OverlayTrigger
              key="top"
              placement="top"
              overlay={<Tooltip id={`tooltip-top`}>The user’s name</Tooltip>}
            >
              <Select
                className="basic-single"
                classNamePrefix="select"
                onInputChange={(value) => setInputValue(value)}
                onChange={(s) => updateForm(s)}
                isSearchable={true}
                name="organisation_name"
                options={renderOptions()}
                filterOption={() => true}
              />
            </OverlayTrigger>
          </Col>
          <Col className="mt-3" xs={12} md={3}>
            <label
              htmlFor="organization_source"
              className="d-flex align-items-center form-label fw-bold"
            >
              <FaInfoCircle className="me-2" /> Organization Source (*)
            </label>
            <OverlayTrigger
              key="top"
              placement="top"
              overlay={
                <Tooltip id={`tooltip-top`}>
                  Source of a persistent identifier representing the
                  organisation (ROR)
                </Tooltip>
              }
            >
              <input
                type="text"
                className={`form-control ${
                  errors.organisation_source ? "is-invalid" : ""
                }`}
                id="organisation_source"
                aria-describedby="organisation_source_help"
                disabled={true}
                {...register("organisation_source", {
                  required: {
                    value: true,
                    message: "Organisation Source is required",
                  },
                  minLength: { value: 3, message: "Minimum length is 3" },
                })}
              />
            </OverlayTrigger>
            <ErrorMessage
              errors={errors}
              name="organisation_source"
              render={({ message }) => <p>{message}</p>}
            />
          </Col>
          <Col className="mt-3" xs={12} md={3}>
            <label
              htmlFor="organization_website"
              className="d-flex align-items-center form-label fw-bold"
            >
              <FaInfoCircle className="me-2" /> Organization Website (*)
            </label>
            <OverlayTrigger
              key="top"
              placement="top"
              overlay={
                <Tooltip id={`tooltip-top`}>The organization’s website</Tooltip>
              }
            >
              <input
                type="text"
                className={`form-control ${
                  errors.organisation_website ? "is-invalid" : ""
                }`}
                id="organisation_website"
                aria-describedby="organisation_website_help"
                disabled={true}
                {...register("organisation_website", {
                  required: {
                    value: true,
                    message: "Organisation Website is required",
                  },
                })}
              />
            </OverlayTrigger>
            <ErrorMessage
              errors={errors}
              name="organisation_website"
              render={({ message }) => <p>{message}</p>}
            />
          </Col>
        </Row>
        <Row>
          <Col className="mt-3" xs={12} md={6}>
            <label
              htmlFor="organization_role"
              className="d-flex align-items-center form-label fw-bold"
            >
              <FaInfoCircle className="me-2" /> Organization Role (*)
            </label>
            <OverlayTrigger
              key="top"
              placement="top"
              overlay={
                <Tooltip id={`tooltip-top`}>
                  The user’s role in the organization
                </Tooltip>
              }
            >
              <input
                type="text"
                className={`form-control ${
                  errors.organisation_role ? "is-invalid" : ""
                }`}
                id="organisation_role"
                aria-describedby="organisation_role_help"
                {...register("organisation_role", {
                  required: {
                    value: true,
                    message: "Organisation Role is required",
                  },
                })}
              />
            </OverlayTrigger>
            <ErrorMessage
              errors={errors}
              name="organisation_role"
              render={({ message }) => <p>{message}</p>}
            />
          </Col>
          <Col className="mt-3" xs={12} md={6}>
            {actors && actors.length > 0 ? actors_select_div : null}
          </Col>
        </Row>

        <Row className="mt-3">
          <span className="form-label fw-bold">User Details (*)</span>
          <Col sm={12} md={4}>
            <InputGroup className="mb-2">
              <InputGroup.Text>Name: </InputGroup.Text>
              <input
                type="text"
                className={`form-control`}
                id="user_name"
                aria-describedby="user_name_help"
                disabled={true}
                value={userProfile?.name || ""}
              />
            </InputGroup>
          </Col>
          <Col sm={12} md={4}>
            <InputGroup className="mb-2">
              <InputGroup.Text>Surname: </InputGroup.Text>
              <input
                type="text"
                className={`form-control`}
                id="user_name"
                aria-describedby="user_name_help"
                disabled={true}
                value={userProfile?.surname || ""}
              />
            </InputGroup>
          </Col>
          <Col sm={12} md={4}>
            <InputGroup className="mb-2">
              <InputGroup.Text>Email: </InputGroup.Text>
              <input
                type="text"
                className={`form-control`}
                id="user_name"
                aria-describedby="user_name_help"
                disabled={true}
                value={userProfile?.email || ""}
              />
            </InputGroup>
          </Col>
        </Row>
        <div className="mb-3 mt-4" style={{ textAlign: "left" }}>
          <button className="btn btn-light border-black" type="submit">
            Submit
          </button>
          <Link to="/validations" className="my-2 btn btn-secondary mx-3">
            <span>Cancel</span>
          </Link>
        </div>
      </form>
    </div>
  );
}

function Validations(props: ValidationProps) {
  const navigate = useNavigate();
  const alert = useRef<AlertInfo>({
    message: "",
  });
  const params = useParams();

  const isAdmin = useRef<boolean>(false);
  const [reviewStatus, setReviewStatus] = useState<string>("");
  const { keycloak, registered } = useContext(AuthContext)!;

  const { mutateAsync: mutateValidationUpdateStatus } =
    useValidationStatusUpdate({
      validation_id: params.id!,
      status: reviewStatus,
      token: keycloak?.token || "",
      isRegistered: registered,
    });

  if (props.admin) {
    isAdmin.current = true;
  }

  const cols = useMemo<ColumnDef<ValidationResponse>[]>(() => {
    const setAdminPrefix = (url: string) => {
      if (props.admin) {
        return "/admin" + url;
      }
      return url;
    };

    return [
      {
        accessorKey: "id",
        header: () => <span>ID</span>,
        cell: (info) => info.getValue(),
        footer: (props) => props.column.id,
        enableColumnFilter: false,
      },
      {
        accessorFn: (row) => row.user_id,
        id: "user_id",
        cell: (info) => info.getValue(),
        header: () => <span>User ID</span>,
        footer: (props) => props.column.id,
        enableColumnFilter: true,
      },
      {
        accessorFn: (row) => row.organisation_name,
        id: "organisation_name",
        cell: (info) => info.getValue(),
        header: () => <span>Organisation Name</span>,
        footer: (props) => props.column.id,
      },
      {
        accessorFn: (row) => row.organisation_role,
        id: "organisation_role",
        cell: (info) => info.getValue(),
        header: () => <span>Organisation Role</span>,
        footer: (props) => props.column.id,
      },
      {
        accessorFn: (row) => row.actor_name,
        id: "actor_name",
        cell: (info) => info.getValue(),
        header: () => <span>Actor</span>,
        footer: (props) => props.column.id,
        enableColumnFilter: true,
      },
      {
        accessorFn: (row) => row.status,
        id: "status",
        cell: (info) => info.getValue(),
        header: () => <span>Status</span>,
        footer: (props) => props.column.id,
      },
      {
        id: "action",
        cell: (props) => {
          if (isAdmin.current) {
            return (
              <div className="edit-buttons btn-group shadow">
                <Link
                  className="btn btn-secondary cat-action-view-link btn-sm "
                  to={setAdminPrefix(`/validations/${props.row.original.id}`)}
                >
                  <FaList />
                </Link>
                {props.row.original.status === "REVIEW" ? (
                  <Link
                    className="btn btn-secondary cat-action-approve-link btn-sm "
                    to={setAdminPrefix(
                      `/validations/${props.row.original.id}/approve#alert-spot`,
                    )}
                  >
                    <FaCheck />
                  </Link>
                ) : null}
                {props.row.original.status === "REVIEW" ? (
                  <Link
                    className="btn btn-secondary cat-action-reject-link btn-sm "
                    to={setAdminPrefix(
                      `/validations/${props.row.original.id}/reject/#alert-spot`,
                    )}
                  >
                    <FaTimes />
                  </Link>
                ) : null}
              </div>
            );
          } else {
            return (
              <div className="edit-buttons btn-group shadow">
                <Link
                  className="btn btn-secondary btn-sm "
                  to={setAdminPrefix(`/validations/${props.row.original.id}`)}
                >
                  <FaList />
                </Link>
              </div>
            );
          }
        },

        header: () => <span>Actions</span>,
        enableColumnFilter: false,
      },
    ];
  }, [props.admin]);

  let rejectCard = null;
  let approveCard = null;

  if (props.toReject) {
    rejectCard = (
      <div className="container">
        <div className="card border-danger mb-2">
          <div className="card-header border-danger text-danger text-center">
            <h5 id="reject-alert">
              <FaExclamationTriangle className="mx-3" />
              <strong>Validation Request Rejection</strong>
            </h5>
          </div>
          <div className=" card-body border-danger text-center">
            Are you sure you want to reject validation with ID:{" "}
            <strong>{params.id}</strong> ?
          </div>
          <div className="card-footer border-danger text-danger text-center">
            <button
              className="btn btn-danger mr-2"
              onClick={() => {
                setReviewStatus(ValidationStatus.REJECTED);
                const promise = mutateValidationUpdateStatus()
                  .catch((err) => {
                    alert.current = {
                      message: "Error during validation rejection.",
                    };
                    throw err;
                  })
                  .then(() => {
                    alert.current = {
                      message: "Validation succesfully rejected.",
                    };
                  })
                  .finally(() => navigate("/validations"));
                toast.promise(promise, {
                  loading: "Rejecting",
                  success: () => `${alert.current.message}`,
                  error: () => `${alert.current.message}`,
                });
              }}
            >
              Reject
            </button>
            <button
              onClick={() => {
                navigate("/admin/validations");
              }}
              className="btn btn-dark"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (props.toApprove) {
    approveCard = (
      <div className="container">
        <div className="card border-success mb-2">
          <div className="card-header border-success text-success text-center">
            <h5 id="approve-alert">
              <FaExclamationTriangle className="mx-3" />
              <strong>Validation Request Approval</strong>
            </h5>
          </div>
          <div className=" card-body border-info text-center">
            Are you sure you want to approve validation with ID:{" "}
            <strong>{params.id}</strong> ?
          </div>
          <div className="card-footer border-success text-success text-center">
            <button
              className="btn btn-success mr-2"
              onClick={() => {
                setReviewStatus(ValidationStatus.REJECTED);
                const promise = mutateValidationUpdateStatus()
                  .catch((err) => {
                    alert.current = {
                      message: "Error during validation approval.",
                    };
                    throw err;
                  })
                  .then(() => {
                    alert.current = {
                      message: "Validation succesfully approved.",
                    };
                  })
                  .finally(() => navigate("/validations"));
                toast.promise(promise, {
                  loading: "Approving",
                  success: () => `${alert.current.message}`,
                  error: () => `${alert.current.message}`,
                });
              }}
            >
              Approve
            </button>
            <button
              onClick={() => {
                navigate("/admin/validations");
              }}
              className="btn btn-dark"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4">
      {rejectCard}
      {approveCard}
      <div
        className={`${
          props.admin && "alert alert-primary"
        } d-flex justify-content-between`}
      >
        <h3 className={`${!props.admin && "cat-view-heading"}`}>
          <FaIdBadge /> validation requests
        </h3>
        {props.admin ? (
          <h3 className="opacity-50">admin mode</h3>
        ) : (
          <Link
            to="/validations/request"
            className="btn btn-light border-black mx-3"
          >
            <FaPlus /> Create New
          </Link>
        )}
      </div>
      {isAdmin.current && keycloak ? (
        <CustomTable columns={cols} dataSource={useAdminValidations} />
      ) : (
        <CustomTable columns={cols} dataSource={useGetValidationList} />
      )}
    </div>
  );
}

function ValidationDetails(props: ValidationProps) {
  const params = useParams();
  const navigate = useNavigate();
  const alert = useRef<AlertInfo>({
    message: "",
  });
  const isAdmin = useRef<boolean>(false);
  const [reviewStatus, setReviewStatus] = useState<string>("");
  const { keycloak, registered } = useContext(AuthContext)!;

  const { mutateAsync: mutateValidationUpdateStatus } =
    useValidationStatusUpdate({
      validation_id: params.id!,
      status: reviewStatus,
      token: keycloak?.token || "",
      isRegistered: registered,
    });

  if (props.admin) {
    isAdmin.current = true;
  }

  const [validation, setValidation] = useState<ValidationResponse>();

  const { data: validationData } = useGetValidationDetails({
    validation_id: params.id!,
    token: keycloak?.token || "",
    isRegistered: registered,
  });

  useEffect(() => {
    setValidation(validationData);
  }, [validationData]);

  let rejectCard = null;
  let approveCard = null;

  if (props.toReject) {
    rejectCard = (
      <div className="container">
        <div className="card border-danger mb-2">
          <div className="card-header border-danger text-danger text-center">
            <h5>
              <FaExclamationTriangle className="mx-3" />
              <strong>Validation Request Rejection</strong>
            </h5>
          </div>
          <div className=" card-body border-danger text-center">
            Are you sure you want to reject validation with ID:{" "}
            <strong>{params.id}</strong> ?
          </div>
          <div className="card-footer border-danger text-danger text-center">
            <button
              className="btn btn-danger mr-2"
              onClick={() => {
                setReviewStatus(ValidationStatus.REJECTED);
                const promise = mutateValidationUpdateStatus()
                  .catch((err) => {
                    alert.current = {
                      message: "Error during validation rejection.",
                    };
                    throw err;
                  })
                  .then(() => {
                    alert.current = {
                      message: "Validation succesfully rejected.",
                    };
                  })
                  .finally(() => navigate("/admin/validations"));
                toast.promise(promise, {
                  loading: "Rejecting",
                  success: () => `${alert.current.message}`,
                  error: () => `${alert.current.message}`,
                });
              }}
            >
              Reject
            </button>
            <button
              onClick={() => {
                navigate(`/admin/validations/${params.id}`);
              }}
              className="btn btn-dark mx-4"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (props.toApprove) {
    approveCard = (
      <div className="container">
        <div className="card border-success mb-2">
          <div className="card-header border-success text-success text-center">
            <h5>
              <FaExclamationTriangle className="mx-3" />
              <strong>Validation Request Approval</strong>
            </h5>
          </div>
          <div className=" card-body border-info text-center">
            Are you sure you want to approve validation with ID:{" "}
            <strong>{params.id}</strong> ?
          </div>
          <div className="card-footer border-success text-success text-center">
            <button
              className="btn btn-success mr-2"
              onClick={() => {
                setReviewStatus(ValidationStatus.APPROVED);
                const promise = mutateValidationUpdateStatus()
                  .catch((err) => {
                    alert.current = {
                      message: "Error during validation approval.",
                    };
                    throw err;
                  })
                  .then(() => {
                    alert.current = {
                      message: "Validation succesfully approved.",
                    };
                  })
                  .finally(() => navigate("/admin/validations"));
                toast.promise(promise, {
                  loading: "Approving",
                  success: () => `${alert.current.message}`,
                  error: () => `${alert.current.message}`,
                });
              }}
            >
              Approve
            </button>
            <button
              onClick={() => {
                navigate(`/admin/validations/${params.id}`);
              }}
              className="btn btn-dark mx-4"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (keycloak?.token) {
    return (
      <div className="mt-4">
        {rejectCard}
        {approveCard}
        <div
          className={`${
            props.admin && "alert alert-primary"
          } d-flex justify-content-between`}
        >
          <h3 className={`${!props.admin && "cat-view-heading"}`}>
            <FaIdBadge /> Validation Request
            <span className="ms-2 badge bg-secondary">
              id: {validation?.id}
            </span>
          </h3>
          {props.admin ? (
            <h3 className="opacity-50">admin mode</h3>
          ) : (
            <Link
              to="/validations/request"
              className="btn btn-light border-black mx-3"
            >
              <FaPlus /> Create New
            </Link>
          )}
        </div>
        <div className="row border-top py-3 mt-4">
          <header className="col-3 h4 text-muted">Requestor</header>
          <section className="col-9">
            <div>
              <strong>User id:</strong> {validation?.user_id}
            </div>
            <div>
              <strong>User name:</strong> {validation?.user_name}
            </div>
            <div>
              <strong>User surname:</strong> {validation?.user_surname}
            </div>
            <div>
              <strong>User email:</strong> {validation?.user_email}
            </div>
          </section>
        </div>
        <div className="row border-top py-3 mt-4">
          <header className="col-3 h4 text-muted">Organisation</header>
          <section className="col-9">
            <div>
              <strong>Id: </strong>
              {validation?.organisation_source === "ROR" ? (
                <>
                  <span className="text-muted">ror.org/</span>
                  <a
                    target="_blank"
                    rel="noreferrer"
                    href={"http://ror.org/" + validation?.organisation_id}
                  >
                    {validation?.organisation_id}
                  </a>
                </>
              ) : (
                <>
                  <span>{validation?.organisation_id}</span>
                  <small>({validation?.organisation_source})</small>
                </>
              )}
            </div>
            <div>
              <strong>Name:</strong> {validation?.organisation_name}
            </div>
            <div>
              <strong>Website:</strong>{" "}
              <a
                target="_blank"
                rel="noreferrer"
                href={validation?.organisation_website}
              >
                {validation?.organisation_website}
              </a>
            </div>
          </section>
        </div>
        <div className="row border-top py-3 mt-4">
          <header className="col-3 h4 text-muted">Roles</header>
          <section className="col-9">
            <div>
              <strong>User role in organisation:</strong>{" "}
              {validation?.organisation_role}
            </div>
            <div>
              <strong>User requests as Actor with:</strong>{" "}
              {validation?.actor_name}
            </div>
          </section>
        </div>

        <div className="row border-top py-3 mt-4">
          <header className="col-3 h4 text-muted">Status</header>
          <section className="col-9">
            <div>
              <strong>Created on:</strong> {validation?.created_on}
            </div>
            {validation?.status === "REVIEW" && (
              <div className="alert alert-info mt-4" role="alert">
                <FaGlasses /> PENDING FOR REVIEW
              </div>
            )}
            {validation?.status === ValidationStatus.REJECTED && (
              <>
                <div className="alert alert-danger mt-4" role="alert">
                  <FaTimes /> REJECTED
                </div>
                <div>
                  <strong>Rejected on:</strong> {validation?.validated_on}
                </div>
                <div>
                  <strong>Rejected by:</strong> {validation?.validated_by}
                </div>
              </>
            )}
            {validation?.status === ValidationStatus.APPROVED && (
              <>
                <div className="alert alert-success mt-4" role="alert">
                  <FaCheck /> APPROVED
                </div>
                <div>
                  <strong>Approved on:</strong> {validation?.validated_on}
                </div>
                <div>
                  <strong>Approved by:</strong> {validation?.validated_by}
                </div>
              </>
            )}
          </section>
        </div>

        {validation?.status === ValidationStatus.REVIEW &&
          isAdmin?.current &&
          !props.toApprove &&
          !props.toReject && (
            <div className="row border-top py-3 mt-4">
              <header className="col-3 h4 text-muted">Actions</header>
              <section className="col-9">
                <Link
                  className="btn btn-light border-black text-success"
                  to={`/validations/${params.id}/approve#alert-spot`}
                >
                  <FaCheck /> Approve
                </Link>
                <Link
                  className="btn btn-light mx-4 text-danger border-black"
                  to={`/validations/${params.id}/reject#alert-spot`}
                >
                  <FaTimes /> Reject
                </Link>
              </section>
            </div>
          )}

        <Link
          className="btn btn-secondary my-4"
          to={`${isAdmin.current ? "/admin" : ""}/validations`}
        >
          Back
        </Link>

        <span id="alert-spot" />
      </div>
    );
  } else {
    return <div>Press Login to authenticate</div>;
  }
}

export { RequestValidation, Validations, ValidationDetails };
